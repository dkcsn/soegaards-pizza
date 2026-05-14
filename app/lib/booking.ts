export const DAILY_PIZZA_CAPACITY = 30;
export const FIRST_PICKUP_TIME = "18:00";
export const LAST_PICKUP_TIME = "20:20";
export const SLOT_INTERVAL_MINUTES = 10;
export const PIZZA_CAPACITY_MINUTES = 2.5;
export const SLOT_CAPACITY_MINUTES = 10;
export const DYNAMIC_SLOT_MINUTES = 5;
export const DEFAULT_MAX_ORDER_PIZZAS = 8;
export const MAX_PIZZAS_PER_SLOT = 4;
export const RELEASE_CONTROL_ENABLED = true;
export const LATE_START_TIME = "20:00";
export const LATE_RELEASE_THRESHOLD_RATIO = 0.8;

export type PickupSlot = {
  id: string;
  label: string;
  dayLabel: string;
  timeLabel: string;
  time: string;
  capacityMinutes: number;
  isDynamic: boolean;
};

export type CapacityOrder = {
  slotId: string;
  pizzaCount: number;
};

export function getCapacityMinutes(pizzaCount: number) {
  return pizzaCount * PIZZA_CAPACITY_MINUTES;
}

export function getRemainingSlotMinutes(pizzaCount: number) {
  return SLOT_CAPACITY_MINUTES - getCapacityMinutes(pizzaCount);
}

export function canCreateDynamicSlot(pizzaCount: number) {
  const remainingMinutes = getRemainingSlotMinutes(pizzaCount);

  return remainingMinutes >= PIZZA_CAPACITY_MINUTES;
}

export function getDynamicSlotCapacity(pizzaCount: number) {
  return Math.floor(getRemainingSlotMinutes(pizzaCount) / PIZZA_CAPACITY_MINUTES);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseClock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

function getServiceDate(now: Date) {
  const serviceDate = new Date(now);
  const { hour, minute } = parseClock(LAST_PICKUP_TIME);
  const serviceEnd = new Date(now);
  serviceEnd.setHours(hour, minute, 0, 0);

  if (now >= serviceEnd) {
    serviceDate.setDate(serviceDate.getDate() + 1);
  }

  return serviceDate;
}

function getDayLabel(slotTime: Date, now: Date) {
  if (slotTime.toDateString() === now.toDateString()) {
    return "Today";
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (slotTime.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(slotTime);
}

function getSlotId(slotTime: Date) {
  const hours = pad(slotTime.getHours());
  const minutes = pad(slotTime.getMinutes());

  return `${slotTime.getFullYear()}-${pad(slotTime.getMonth() + 1)}-${pad(
    slotTime.getDate(),
  )}-${hours}${minutes}`;
}

function createSlot(
  slotTime: Date,
  now: Date,
  capacityMinutes: number,
  isDynamic: boolean,
) {
  const hours = pad(slotTime.getHours());
  const minutes = pad(slotTime.getMinutes());
  const dayLabel = getDayLabel(slotTime, now);
  const timeLabel = `${hours}:${minutes}`;

  return {
    id: getSlotId(slotTime),
    label: `${dayLabel} ${timeLabel}`,
    dayLabel,
    timeLabel,
    time: slotTime.toISOString(),
    capacityMinutes,
    isDynamic,
  };
}

function getSlotTimeFromId(slotId: string) {
  const match = slotId.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/);

  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}

function getSlotStartTime(slots: PickupSlot[], slotId: string) {
  const slot = slots.find((candidate) => candidate.id === slotId);

  if (slot) {
    return new Date(slot.time).getTime();
  }

  return getSlotTimeFromId(slotId);
}

function getOverlapMinutes(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB)) / 60000;
}

function ceilToFiveMinuteBoundary(time: number) {
  const fiveMinutes = DYNAMIC_SLOT_MINUTES * 60 * 1000;

  return Math.ceil(time / fiveMinutes) * fiveMinutes;
}

function getOrderIntervals(slots: PickupSlot[], orders: CapacityOrder[]) {
  return orders.flatMap((order) => {
    const startTime = getSlotStartTime(slots, order.slotId);

    if (startTime === undefined) {
      return [];
    }

    return [
      {
        startTime,
        endTime: startTime + getCapacityMinutes(order.pizzaCount) * 60 * 1000,
      },
    ];
  });
}

function getServiceEndTime(slots: PickupSlot[]) {
  const finalSlot = slots.at(-1);

  if (!finalSlot) {
    return 0;
  }

  return new Date(finalSlot.time).getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000;
}

export function generateStandardPickupSlots(now = new Date()) {
  const slots: PickupSlot[] = [];
  const serviceDate = getServiceDate(now);
  const startClock = parseClock(FIRST_PICKUP_TIME);
  const endClock = parseClock(LAST_PICKUP_TIME);
  const start = new Date(serviceDate);
  start.setHours(startClock.hour, startClock.minute, 0, 0);

  const end = new Date(serviceDate);
  end.setHours(endClock.hour, endClock.minute, 0, 0);

  for (
    const slotTime = new Date(start);
    slotTime <= end;
    slotTime.setMinutes(slotTime.getMinutes() + SLOT_INTERVAL_MINUTES)
  ) {
    if (slotTime > now) {
      slots.push(createSlot(slotTime, now, SLOT_CAPACITY_MINUTES, false));
    }
  }

  return slots;
}

export function generatePickupSlotsWithDynamicCapacity(
  standardSlots: PickupSlot[],
  orders: CapacityOrder[],
  now = new Date(),
) {
  const intervals = getOrderIntervals(standardSlots, orders);
  const dynamicSlots = standardSlots.flatMap((slot) => {
    const bucketStart = new Date(slot.time).getTime();
    const bucketEnd = bucketStart + SLOT_CAPACITY_MINUTES * 60 * 1000;
    const usedIntervals = intervals
      .map((interval) => ({
        startTime: Math.max(interval.startTime, bucketStart),
        endTime: Math.min(interval.endTime, bucketEnd),
      }))
      .filter((interval) => interval.startTime < interval.endTime)
      .sort((a, b) => a.startTime - b.startTime);

    if (usedIntervals.length === 0) {
      return [];
    }

    const freeIntervals: Array<{ startTime: number; endTime: number }> = [];
    let cursor = bucketStart;

    for (const interval of usedIntervals) {
      if (interval.startTime > cursor) {
        freeIntervals.push({ startTime: cursor, endTime: interval.startTime });
      }

      cursor = Math.max(cursor, interval.endTime);
    }

    if (cursor < bucketEnd) {
      freeIntervals.push({ startTime: cursor, endTime: bucketEnd });
    }

    return freeIntervals.flatMap((interval) => {
      const dynamicStartTime = ceilToFiveMinuteBoundary(interval.startTime);
      const freeMinutes = (interval.endTime - dynamicStartTime) / 60000;

      if (
        dynamicStartTime === bucketStart ||
        freeMinutes < DYNAMIC_SLOT_MINUTES ||
        dynamicStartTime <= now.getTime()
      ) {
        return [];
      }

      return [
        createSlot(
          new Date(dynamicStartTime),
          now,
          DYNAMIC_SLOT_MINUTES,
          true,
        ),
      ];
    });
  });

  return [...standardSlots, ...dynamicSlots].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
}

export function getReservedPizzaCount(orders: CapacityOrder[]) {
  return orders.reduce((sum, order) => sum + order.pizzaCount, 0);
}

export function isLatePickupSlot(slot: Pick<PickupSlot, "timeLabel">) {
  return slot.timeLabel >= LATE_START_TIME;
}

export function areLateSlotsReleased(orders: CapacityOrder[]) {
  return areLateSlotsReleasedForCapacity(orders, DAILY_PIZZA_CAPACITY);
}

export function areLateSlotsReleasedForCapacity(
  orders: CapacityOrder[],
  dailyCapacity: number,
) {
  if (!RELEASE_CONTROL_ENABLED) {
    return true;
  }

  return getReservedPizzaCount(orders) >= dailyCapacity * LATE_RELEASE_THRESHOLD_RATIO;
}

export function canReservePickupSlot(
  standardSlots: PickupSlot[],
  orders: CapacityOrder[],
  slot: PickupSlot,
  pizzaCount: number,
  dailyCapacity = DAILY_PIZZA_CAPACITY,
) {
  if (pizzaCount <= 0) {
    return false;
  }

  if (orders.some((order) => order.slotId === slot.id)) {
    return false;
  }

  if (getReservedPizzaCount(orders) + pizzaCount > dailyCapacity) {
    return false;
  }

  if (isLatePickupSlot(slot) && !areLateSlotsReleasedForCapacity(orders, dailyCapacity)) {
    return false;
  }

  const requestedMinutes = getCapacityMinutes(pizzaCount);

  if (slot.isDynamic && requestedMinutes > slot.capacityMinutes) {
    return false;
  }

  const startTime = getSlotStartTime(standardSlots, slot.id);

  if (startTime === undefined) {
    return false;
  }

  const endTime = startTime + requestedMinutes * 60 * 1000;

  if (endTime > getServiceEndTime(standardSlots)) {
    return false;
  }

  const intervals = getOrderIntervals(standardSlots, orders);

  if (
    intervals.some(
      (interval) =>
        getOverlapMinutes(startTime, endTime, interval.startTime, interval.endTime) > 0,
    )
  ) {
    return false;
  }

  return standardSlots.every((bucket) => {
    const bucketStart = new Date(bucket.time).getTime();
    const bucketEnd = bucketStart + SLOT_CAPACITY_MINUTES * 60 * 1000;
    const requestedOverlap = getOverlapMinutes(
      startTime,
      endTime,
      bucketStart,
      bucketEnd,
    );

    if (requestedOverlap === 0) {
      return true;
    }

    const usedMinutes = intervals.reduce(
      (sum, interval) =>
        sum +
        getOverlapMinutes(
          interval.startTime,
          interval.endTime,
          bucketStart,
          bucketEnd,
        ),
      0,
    );

    return usedMinutes + requestedOverlap <= SLOT_CAPACITY_MINUTES;
  });
}
