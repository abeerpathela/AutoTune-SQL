// Define the schema categories exactly as requested
const schemaCategories = {
  "users.id": "ID",
  "orders.user_id": "ID",
  "products.id": "ID",
  "orders.total": "MONEY",
  "products.price": "MONEY",
  "users.age": "NUMERIC",
  "users.email": "TEXT",
  "products.name": "TEXT"
};

// Helper: Extract table aliases from SQL
const extractAliases = (sql) => {
  const aliases = {};
  // Regex to capture table and alias in FROM/JOIN clauses
  // Matches "users u" or "orders o" etc.
  const fromJoinRegex = /(?:FROM|JOIN)\s+(\w+)\s+(\w+)/gi;
  let match;
  while ((match = fromJoinRegex.exec(sql)) !== null) {
    const table = match[1];
    const alias = match[2];
    aliases[alias] = table;
  }
  return aliases;
};

// Helper: Resolve column name with alias to full "table.column"
const resolveColumn = (colStr, aliases) => {
  const parts = colStr.split('.');
  if (parts.length !== 2) return null;
  const maybeAlias = parts[0];
  const column = parts[1];
  
  // Resolve alias
  const table = aliases[maybeAlias] || maybeAlias;
  return `${table}.${column}`;
};

// Helper: Extract all join conditions from SQL
const extractJoinConditions = (sql) => {
  const conditions = [];
  // Regex to capture everything after ON
  const onRegex = /\bON\b\s+([^;]+?)(?=\s*(?:JOIN|WHERE|GROUP|HAVING|ORDER|LIMIT|$))/gi;
  let match;
  
  while ((match = onRegex.exec(sql)) !== null) {
    const conditionStr = match[1].trim();
    // Now extract equality pairs from this condition string
    const equalityRegex = /([\w.]+)\s*=\s*([\w.]+)/g;
    let eqMatch;
    while ((eqMatch = equalityRegex.exec(conditionStr)) !== null) {
      conditions.push({
        left: eqMatch[1],
        right: eqMatch[2]
      });
    }
  }
  
  return conditions;
};

// Detect logic flaws!
const detectLogicFlaws = (sql) => {
  const flaws = [];
  
  // First, check simple logic flaws
  if (sql.match(/\b1\s*=\s*0\b/i)) {
    flaws.push('Always false condition (1 = 0)');
  }
  
  if (sql.match(/age\s*>\s*200/i) || sql.match(/age\s*<\s*0/i)) {
    flaws.push('Unrealistic age predicate');
  }
  
  if (sql.match(/limit\s*0/i)) {
    flaws.push('LIMIT 0 is useless');
  }
  
  // Now check joins!
  const aliases = extractAliases(sql);
  const joinConditions = extractJoinConditions(sql);
  
  for (const condition of joinConditions) {
    const leftFull = resolveColumn(condition.left, aliases);
    const rightFull = resolveColumn(condition.right, aliases);
    
    if (!leftFull || !rightFull) continue;
    
    const leftCategory = schemaCategories[leftFull];
    const rightCategory = schemaCategories[rightFull];
    
    if (leftCategory && rightCategory) {
      // Check if categories are incompatible
      const incompatiblePairs = [
        ["ID", "MONEY"],
        ["MONEY", "ID"],
        ["ID", "TEXT"],
        ["TEXT", "ID"],
        ["MONEY", "TEXT"],
        ["TEXT", "MONEY"],
        ["NUMERIC", "TEXT"],
        ["TEXT", "NUMERIC"]
      ];
      
      const isIncompatible = incompatiblePairs.some(
        ([a, b]) => (leftCategory === a && rightCategory === b)
      );
      
      if (isIncompatible) {
        const flawMessage = `Joining ${leftCategory} column ${leftFull} with ${rightCategory} column ${rightFull}`;
        flaws.push(flawMessage);
        // Also log for debugging
        console.log(`🔍 Detected Logic Flaw: ${leftFull} (${leftCategory}) ↔ ${rightFull} (${rightCategory})`);
      }
    }
  }
  
  return flaws;
};

module.exports = { detectLogicFlaws };
