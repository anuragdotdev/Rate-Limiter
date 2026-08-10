import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import openapi from '../openapi.json';

const router = Router();

router.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi as any));

export default router;
