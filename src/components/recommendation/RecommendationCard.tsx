"use client";

import { motion } from "framer-motion";

function getItemImage(item: any) {
  return (
    item?.image ||
    item?.heroImage ||
    item?.coverImage ||
    item?.thumbnail ||
    item?.photo ||
    item?.photoUrl ||
    item?.imageUrl ||
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
  );
}

function getItemTitle(item: any) {
  return item?.title || item?.name || "Recommendation";
}

function getItemDescription(item: any) {
  return (
    item?.description ||
    item?.summary ||
    item?.subtitle ||
    "AI-selected recommendation based on your trip inputs."
  );
}

function getItemPrice(item: any) {
  if (item?.price) return `$${item.price}`;
  if (item?.priceFrom) return `From $${item.priceFrom}`;
  if (item?.totalPrice) return `$${item.totalPrice}`;
  return "Included";
}

function getItemMeta(item: any) {
  return (
    item?.rating ||
    item?.provider ||
    item?.duration ||
    item?.category ||
    "AI ranked"
  );
}

export function RecommendationCard({
  item,
  selected,
  onSelect,
  selectLabel,
}: any) {
  const image = getItemImage(item);
  const title = getItemTitle(item);
  const description = getItemDescription(item);
  const price = getItemPrice(item);
  const meta = getItemMeta(item);

  return (
    <motion.div
  whileHover={{ y: -4, scale: 1.01 }}
  transition={{ duration: 0.22 }}
  className="
  group relative overflow-hidden
  rounded-[22px]
  border border-white/10
  bg-white/[0.05]
  backdrop-blur-2xl
  shadow-[0_10px_40px_rgba(0,0,0,0.28)]
  transition-all duration-300
  hover:border-white/20
  hover:bg-white/[0.08]
"
>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.28),transparent_42%)]" />
</div>

      {/* IMAGE */}
      <div className="relative h-36 w-full overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/70 backdrop-blur-xl">
          AI Pick
        </div>

        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur-xl">
          {meta}
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-white">
            {title}
          </h3>

          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
            {selected ? "Selected" : "Available"}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/60">
          {description}
        </p>

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
          <span>{price}</span>
          <span>{item?.location || item?.city || item?.area || ""}</span>
        </div>

        <button
          onClick={onSelect}
          className={`mt-4 w-full rounded-full px-3 py-2 text-xs font-medium transition ${
            selected
              ? "bg-[#ff7a00] text-black"
              : "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
          }`}
        >
          {selectLabel}
        </button>
      </div>
    </motion.div>
  );
}