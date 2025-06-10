import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import winston from 'winston';
import { IBitbucketUseCase } from '../../application/use-cases/IBitbucketUseCase.js';
import { TYPES } from '../types.js';

@injectable()
export class SseService {
    private readonly app: express.Application;
    private clients: Response[] = [];
    private readonly port: number;

    constructor(
        @inject(TYPES.Logger) private readonly logger: winston.Logger,
        @inject(TYPES.IBitbucketUseCase) private readonly bitbucketUseCase: IBitbucketUseCase
    ) {
        this.app = express();
        this.port = parseInt(process.env.SSE_PORT || '3000', 10);
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.app.get('/events', (req: Request, res: Response) => {
            this.logger.info('SSE client connected');
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders(); // Flush the headers to establish the connection

            this.clients.push(res);

            // Send a welcome message
            res.write('data: {\"message\": \"Connected to Bitbucket SSE stream\"}\n\n');

            req.on('close', () => {
                this.logger.info('SSE client disconnected');
                this.clients = this.clients.filter(client => client !== res);
            });
        });

        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).send('OK');
        });
    }

    public start(): void {
        this.app.listen(this.port, () => {
            this.logger.info(`SSE server listening on http://localhost:${this.port}`);
        });

        // Start polling for Bitbucket data every 30 seconds
        setInterval(() => this.pollAndSendData(), 30000);
    }

    private async pollAndSendData(): Promise<void> {
        if (this.clients.length === 0) {
            return; // No clients connected, do nothing
        }

        this.logger.info(`Polling for Bitbucket data for ${this.clients.length} SSE clients...`);
        try {
            // Example: Fetch open pull requests from a default project.
            // This part needs to be adapted based on what data you want to stream.
            // For now, I'll create a placeholder for listing pull requests.
            // The IBitbucketUseCase doesn't have a method for listing all PRs yet,
            // so I will simulate it. In a real scenario, you'd add this method.

            const mockData = {
                type: 'pull-requests',
                data: {
                    id: Math.floor(Math.random() * 1000),
                    title: 'A new change has been proposed',
                    timestamp: new Date().toISOString()
                }
            };

            this.sendEventToAll(mockData);

        } catch (error) {
            this.logger.error('Error polling Bitbucket data:', error);
        }
    }

    private sendEventToAll(data: any): void {
        const eventString = `data: ${JSON.stringify(data)}\n\n`;
        this.clients.forEach(client => client.write(eventString));
    }
}
