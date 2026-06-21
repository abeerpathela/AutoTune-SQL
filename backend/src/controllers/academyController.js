const academyService = require('../services/academyService');

const getCourses = async (req, res) => {
  try {
    res.json(await academyService.getCourses());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCatalog = async (req, res) => {
  try {
    const catalog = await academyService.getAcademyCatalog(req.user.id);
    res.json(catalog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChapterByOrder = async (req, res) => {
  try {
    const chapter = await academyService.getChapterByGlobalOrder(req.user.id, req.params.order);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    res.json(chapter);
  } catch (error) {
    if (error.code === 'CHAPTER_LOCKED') {
      return res.status(403).json({
        error: error.message,
        code: 'CHAPTER_LOCKED',
        redirectOrder: error.redirectOrder,
      });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await academyService.getCourseById(req.params.courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    res.status(201).json(await academyService.createCourse(title, description));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    res.json(await academyService.updateCourse(req.params.courseId, req.body));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    await academyService.deleteCourse(req.params.courseId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChapterById = async (req, res) => {
  try {
    const chapter = await academyService.getChapterById(req.params.chapterId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    res.json(chapter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createChapter = async (req, res) => {
  try {
    const { title, content, order, videoUrl, practiceSql, globalOrder } = req.body;
    res.status(201).json(
      await academyService.createChapter(req.params.courseId, title, content, order, videoUrl, practiceSql, globalOrder)
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateChapter = async (req, res) => {
  try {
    res.json(await academyService.updateChapter(req.params.chapterId, req.body));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteChapter = async (req, res) => {
  try {
    await academyService.deleteChapter(req.params.chapterId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createQuiz = async (req, res) => {
  try {
    res.status(201).json(await academyService.createQuiz(req.params.chapterId, req.body.questions));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateQuiz = async (req, res) => {
  try {
    res.json(await academyService.updateQuiz(req.params.quizId, req.body.questions));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    await academyService.deleteQuiz(req.params.quizId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

const markWatched = async (req, res) => {
  try {
    res.json(await academyService.markWatched(req.user.id, req.params.chapterId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markExerciseCompleted = async (req, res) => {
  try {
    res.json(await academyService.markExerciseCompleted(req.user.id, req.params.chapterId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProgress = async (req, res) => {
  try {
    res.json(await academyService.updateProgress(req.user.id, req.params.chapterId, req.body.status));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    res.json(await academyService.evaluateQuiz(req.user.id, req.params.quizId, req.body.answers));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getCourses,
  getCatalog,
  getChapterByOrder,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getProgress,
  getProgressDetails,
  markWatched,
  markExerciseCompleted,
  updateProgress,
  submitQuiz,
};
