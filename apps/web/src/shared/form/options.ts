import { CATEGORIES, CATEGORY_LABEL, TIME_SLOT_LABEL, type Category, type TimeSlot } from '@findit/shared';
import type { ChipOption } from './ChipGroup';

export const CATEGORY_OPTIONS: ChipOption<Category>[] = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }));

export const TIME_SLOT_OPTIONS: ChipOption<TimeSlot>[] = (['BEFORE_SCHOOL', 'LUNCH', 'AFTER_SCHOOL', 'UNKNOWN'] as const).map(
  (t) => ({ value: t, label: TIME_SLOT_LABEL[t] }),
);
