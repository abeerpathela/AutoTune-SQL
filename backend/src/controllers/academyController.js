const academyService = require('../services/academyService');

const getCourses = async (req, res) => {
  try {
    const courses = await academyService.getCourses();
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await academyService.getCourseById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    const course = await academyService.createCourse(title, description);
    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await academyService.updateCourse(req.params.courseId, req.body);
    res.json(course);
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
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.json(chapter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createChapter = async (req, res) => {
  try {
    const { title, content, order } = req.body;
    const chapter = await academyService.createChapter(req.params.courseId, title, content, order);
    res.status(201).json(chapter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateChapter = async (req, res) => {
  try {
    const chapter = await academyService.updateChapter(req.params.chapterId, req.body);
    res.json(chapter);
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
    const { questions } = req.body;
    const quiz = await academyService.createQuiz(req.params.chapterId, questions);
    res.status(201).json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const { questions } = req.body;
    const quiz = await academyService.updateQuiz(req.params.quizId, questions);
    res.json(quiz);
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
    const progress = await academyService.calculateProgress(req.user.id);
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProgressDetails = async (req, res) => {
  try {
    const progress = await academyService.getUserProgress(req.user.id);
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { status } = req.body;
    const progress = await academyService.updateProgress(req.user.id, req.params.chapterId, status);
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const result = await academyService.evaluateQuiz(req.user.id, req.params.quizId, answers);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getCourses,
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
  updateProgress,
  submitQuiz,
};
