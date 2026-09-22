import type { ReadyPlanContent } from "@/lib/ready-plan-content";

export type ReadyPlanBookableItems = {
  ids: string[];
  recordIdsByContentId: Record<string, string>;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function getReadyPlanBookableItems(
  content: ReadyPlanContent,
  dayRecords?: any[] | null,
): ReadyPlanBookableItems {
  const ids = new Set<string>();
  const recordIdsByContentId: Record<string, string> = {};

  content.days.forEach((day) => {
    day.timelineItems.forEach((item) => {
      if ((item as any).showButton !== false && hasText(item.deeplink)) {
        ids.add(item.id);
      }
    });
  });

  if (Array.isArray(dayRecords)) {
    dayRecords.forEach((dayRecord, dayIndex) => {
      const contentDay = content.days[dayIndex];
      const itemRecords = Array.isArray(dayRecord?.itemRecords) ? dayRecord.itemRecords : [];

      itemRecords.forEach((itemRecord: any, itemIndex: number) => {
        const contentItem = contentDay?.timelineItems?.[itemIndex];
        if (!contentItem || !hasText(itemRecord?.affiliateUrl)) return;

        ids.add(contentItem.id);
        if (hasText(itemRecord?.id)) {
          recordIdsByContentId[contentItem.id] = itemRecord.id;
        }
      });
    });
  }

  return {
    ids: Array.from(ids),
    recordIdsByContentId,
  };
}
