const express = require('express');
const router = express.Router();
const academyController = require('../controllers/academyController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Courses
router.get('/courses', academyController.getCourses);
router.get('/courses/:courseId', academyController.getCourseById);
router.post('/courses', authenticate, requireAdmin, academyController.createCourse);
router.put('/courses/:courseId', authenticate, requireAdmin, academyController.updateCourse);
router.delete('/courses/:courseId', authenticate, requireAdmin, academyController.deleteCourse);

// Chapters
router.get('/chapters/:chapterId', academyController.getChapterById);
router.post('/courses/:courseId/chapters', authenticate, requireAdmin, academyController.createChapter);
router.put('/chapters/:chapterId', authenticate, requireAdmin, academyController.updateChapter);
router.delete('/chapters/:chapterId', authenticate, requireAdmin, academyController.deleteChapter);

// Quizzes
router.post('/chapters/:chapterId/quizzes', authenticate, requireAdmin, academyController.createQuiz);
router.put('/quizzes/:quizId', authenticate, requireAdmin, academyController.updateQuiz);
router.delete('/quizzes/:quizId', authenticate, requireAdmin, academyController.deleteQuiz);

// User Progress
router.get('/progress', authenticate, academyController.getProgress);
router.get('/progress/details', authenticate, academyController.getProgressDetails);
router.post('/progress/:chapterId', authenticate, academyController.updateProgress);

// Quiz Evaluation
router.post('/quizzes/:quizId/evaluate', authenticate, academyController.submitQuiz);

module.exports = router;
