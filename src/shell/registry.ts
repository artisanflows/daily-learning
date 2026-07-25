import type { LearningModule } from '../platform/module';
import { chessModule } from '../modules/chess';
import { koreanModule } from '../modules/korean';
import { wineModule } from '../modules/wine';
import { artModule } from '../modules/art';

// The order here is the order subjects appear on the home screen.
// A future trainer is added by implementing LearningModule and listing it here.
// Physics + Psychology are built but PARKED (Simon's call, 2026-07-25): focus on
// depth in chess/korean/wine/art first. Re-enable by re-importing them here —
// their code, content, and any saved progress stay intact.
export const MODULES: LearningModule[] = [
  chessModule(), koreanModule(),
  wineModule(), artModule(),
];
