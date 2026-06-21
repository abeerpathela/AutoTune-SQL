const academyService = require('../services/academyService');

/**
 * Lightweight catalog — static chapter metadata from Redis + user progress join.
 */
const getCatalog = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized — userId missing from token' });
    }

    const [chapters, progressSummary] = await Promise.all([
      academyService.getAcademyCatalog(userId),
      academyService.calculateProgress(userId),
    ]);

    const resumeOrder =
      chapters.find((ch) => !ch.isCompleted)?.globalOrder ??
      chapters[0]?.globalOrder ??
      1;

    res.json({
      chapters,
      resumeOrder,
      userId,
      totalProgress: progressSummary.percentage,
      completedCount: progressSummary.completed,
      totalChapters: progressSummary.total,
    });
  } catch (error) {
    console.error('[academy] getCatalog', req.user?.id, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChapterContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const content = await academyService.getChapterContent(userId, req.params.id);

    if (!content) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(content);
  } catch (error) {
    if (error.code === 'CHAPTER_LOCKED') {
      return res.status(403).json({
        error: error.message,
        code: 'CHAPTER_LOCKED',
        redirectOrder: error.redirectOrder,
      });
    }
    console.error('[academy] getChapterContent', req.user?.id, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChapterDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const chapter = await academyService.getChapterByGlobalOrder(userId, req.params.order);

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json({
      ...chapter,
      isCompleted: Boolean(chapter.isCompleted ?? chapter.status?.isCompleted ?? false),
    });
  } catch (error) {
    if (error.code === 'CHAPTER_LOCKED') {
      return res.status(403).json({
        error: error.message,
        code: 'CHAPTER_LOCKED',
        redirectOrder: error.redirectOrder,
      });
    }
    console.error('[academy] getChapterDetails', req.user?.id, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChapterByOrder = getChapterDetails;

const getProgress = async (req, res) => {
  try {
    res.json(await academyService.calculateProgress(req.user.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProgressDetails = async (req, res) => {
  try {
    res.json(await academyService.getUserProgress(req.user.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Atomic progress upsert — on completion, recalculates master state from DB.
 */
const updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chapterId } = req.params;
    const { isCompleted, videoWatched, videoCompleted, quizScore, videoWatchPercent } = req.body;

    const result = await academyService.updateProgress(userId, chapterId, {
      isCompleted,
      videoWatched,
      videoWatchPercent,
      videoCompleted,
      quizScore,
    });

    res.json(result);
  } catch (error) {
    console.error('[academy] updateProgress', req.user?.id, error.message);
    res.status(400).json({ error: error.message });
  }
};

const getProgressSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    res.json(await academyService.getProgressSummary(userId));
  } catch (error) {
    console.error('[academy] getProgressSummary', req.user?.id, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const completeVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId, maxWatchPercent } = req.body;

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const result = await academyService.completeVideo(
      userId,
      req.params.chapterId,
      videoId,
      Number(maxWatchPercent) || 0
    );
    res.json(result);
  } catch (error) {
    console.error('[academy] completeVideo', req.user?.id, error.message);
    res.status(400).json({ error: error.message });
  }
};

const markVideoWatched = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId, maxWatchPercent } = req.body;

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const result = await academyService.markVideoWatched(
      userId,
      req.params.chapterId,
      videoId,
      Number(maxWatchPercent) || 0
    );
    res.json(result);
  } catch (error) {
    console.error('[academy] markVideoWatched', req.user?.id, error.message);
    res.status(400).json({ error: error.message });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    const result = await academyService.submitQuiz(userId, req.params.chapterId, answers);
    res.json(result);
  } catch (error) {
    console.error('[academy] submitQuiz', req.user?.id, error.message);
    res.status(400).json({ error: error.message });
  }
};

const failQuiz = async (req, res) => {
  try {
    const reason = req.body?.reason || 'focus_violation';
    const result = await academyService.failQuiz(req.user.id, req.params.chapterId, reason);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const recordFocusViolation = async (req, res) => {
  try {
    const result = await academyService.recordFocusViolation(req.user.id, req.params.chapterId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getCatalog,
  getChapterContent,
  getChapterDetails,
  getChapterByOrder,
  getProgress,
  getProgressSummary,
  getProgressDetails,
  updateProgress,
  completeVideo,
  markVideoWatched,
  submitQuiz,
  failQuiz,
  recordFocusViolation,
};
