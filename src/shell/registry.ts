import type { LearningModule } from '../platform/module';
import { chessModule } from '../modules/chess';
import { koreanModule } from '../modules/korean';
import { wineModule } from '../modules/wine';

// The order here is the order subjects appear on the home screen.
// A future trainer is added by implementing LearningModule and listing it here.
export const MODULES: LearningModule[] = [chessModule(), koreanModule(), wineModule()];
