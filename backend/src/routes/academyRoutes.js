const express = require('express');
const router = express.Router();
const academyController = require('../controllers/academyController');
const { authenticate } = require('../middleware/auth');

router.get('/catalog', authenticate, academyController.getCatalog);
router.get('/chapters/:id/content', authenticate, academyController.getChapterContent);
router.get('/chapters/by-order/:order', authenticate, academyController.getChapterByOrder);
router.get('/progress', authenticate, academyController.getProgress);
router.get('/progress/summary', authenticate, academyController.getProgressSummary);
router.get('/progress/details', authenticate, academyController.getProgressDetails);
router.post('/chapters/:chapterId/complete-video', authenticate, academyController.completeVideo);
router.patch('/chapters/:chapterId/progress', authenticate, academyController.updateProgress);
router.post('/chapters/:chapterId/progress', authenticate, academyController.updateProgress);
router.post('/chapters/:chapterId/video-watched', authenticate, academyController.markVideoWatched);
router.post('/chapters/:chapterId/submit-quiz', authenticate, academyController.submitQuiz);
router.post('/chapters/:chapterId/quiz/fail', authenticate, academyController.failQuiz);
router.post('/chapters/:chapterId/quiz/violation', authenticate, academyController.recordFocusViolation);

module.exports = router;
