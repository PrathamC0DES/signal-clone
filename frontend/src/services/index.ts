import { ISignalService } from './ISignalService';
import { MockSignalService } from './MockSignalService';
import { RealSignalService } from './RealSignalService';

// Set NEXT_PUBLIC_USE_MOCK_API=true in .env.local to force in-memory mock mode.
// Defaults to RealSignalService connected to the FastAPI + WebSocket backend.
const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

let serviceInstance: ISignalService;

export function getSignalService(): ISignalService {
  if (!serviceInstance) {
    if (useMock) {
      serviceInstance = new MockSignalService();
    } else {
      serviceInstance = new RealSignalService();
    }
  }
  return serviceInstance;
}
