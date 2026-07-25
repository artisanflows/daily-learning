import { makeKnowledgeModule } from '../knowledge-core/module';
import { WINE } from './content';

// Wine — first knowledge domain. All the machinery lives in knowledge-core.
export const wineModule = () => makeKnowledgeModule(WINE);
