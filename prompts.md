# Kraya 3D icon prompts

Copy-paste these into Flow, Midjourney, or Ideogram. Every prompt is built for **Kraya** the Wayam AI procurement command center for automotive electronics not generic supply-chain clipart.

Use them on page headers, the program pipeline stage tiles, KPI tiles, agent cards, observation cards and empty states. Do **not** put readable text, part numbers, PO numbers, supplier names, OEM logos or certification marks in the render. The Lucide icons in the sidebar stay; these are the dimensional marks for headers, tiles and empty surfaces.

## Color lock (use this every time)

Wayam orange is token `--ref-orange-500`.

| Role | Hex | Token |
| --- | --- | --- |
| Hero / body | `#FF7B1C` | `--ref-orange-500` |
| Rim / highlight | `#FFB365` | `--ref-orange-300` |
| Mid shade | `#FF963D` | `--ref-orange-400` |
| Recess / core | `#C1460F` | `--ref-orange-700` |
| Deep shadow | `#9A3814` | `--ref-orange-800` |
| Ember | `#431507` | `--ref-orange-950` |
| Studio void | `#101010` | `--ref-gray-950` |
| Graphite body | `#191919` | `--ref-gray-900` |

Do not substitute coral, amber, gold, or red. If a second material is needed, it is **dark graphite**, never a second brand color.

## Login page background

Save the render as `public/brand/login-bg.jpg`. The login screen object-covers it in the left panel (~4:5 portrait). No text, logos, faces, part numbers, PO numbers, or Gemini watermark.

```
Cinematic still for a dark procurement command-center login, 4:5 portrait 2400x3000, 8k, photoreal 3D product cinema. A vast graphite #101010 electronics factory hall seen from a three-quarter mezzanine: a single surface-mount line runs into the distance, a Wayam-orange #FF7B1C pick-and-place gantry frozen mid-stroke above a graphite PCB panel, reels of components on feeders along the near side, a reflow-oven tunnel glowing #C1460F from within, and at the end of the line one finished automotive camera module with a glass lens barrel resting on an orange pallet under a single shaft of #FFB365 rim light from upper left. Abstract parts travel as a slow stream of orange embers along graphite conveyor channels toward that module, material converging on a launch, not literal boxes of stock. Satin polymer, brushed graphite and one glass specular only. Shallow depth of field, anamorphic bokeh, no floor-shadow fade into white. No people, no human faces, no desks, no laptops, no UI screens with readable text, no letters, no numbers, no logos, no certification marks, no watermarks, no Gemini sparkle. Hue locked to #FF7B1C, not red, not amber, not gold.
```

## Style prefix (paste before every subject)

```
3D product icon, one object, centered, 1:1 square, 8k, studio key light from upper left, dark graphite #101010 void, no floor shadow fade, Wayam orange #FF7B1C as the only chromatic color with #FFB365 rim light and #C1460F recesses, satin polymer with a single glass specular, crisp silhouette readable at 64px, no text, no letters, no numbers, no logos, no human faces, no watermarks, no extra props
```

Then append the subject line.

---

## Program pipeline stages

Use on the nine stage tiles of the pipeline canvas on `/dashboard`, and on the Next SOP and awarded-revenue KPI tiles on `/programs`.

1. a 3D Wayam-orange `#FF7B1C` sealed courier envelope from a vehicle maker, slightly inflated, with a graphite string-and-button closure, RFI received
2. a 3D Wayam-orange `#FF7B1C` stack of specification sheets under a graphite magnifier loupe on a swing arm, sheets blank, RFQ analysis
3. a 3D Wayam-orange `#FF7B1C` quotation folder standing upright with a graphite cost-breakdown tab strip of six blank tabs, quote submitted
4. a 3D Wayam-orange `#FF7B1C` nomination trophy shaped like a small ECU on a graphite plinth, program awarded, no engraving
5. a 3D Wayam-orange `#FF7B1C` exploded stack of four PCB assembly layers held in a graphite clamp frame with a padlock, BOM frozen
6. a 3D Wayam-orange `#FF7B1C` pair of interlocking gear-toothed connector halves, one orange and one graphite, fully mated, suppliers onboarded
7. a 3D Wayam-orange `#FF7B1C` rugged purchase-order tablet with a graphite stylus clipped to its side and a blank screen, POs placed
8. a 3D Wayam-orange `#FF7B1C` short section of SMT conveyor carrying three PCB panels in a row, graphite rails, production scheduled
9. a 3D Wayam-orange `#FF7B1C` finished ECU housing with a sealed connector rolling off the end of a graphite conveyor under a raised barrier arm, start of production achieved

## Command center

Use on the `/dashboard` header, the agent observation cards on `/dashboard` and `/programs/[id]`, and every empty state.

10. a 3D Wayam-orange `#FF7B1C` automotive front camera module with a glass lens barrel and a graphite rear housing, three-quarter view, the hero product
11. a 3D Wayam-orange `#FF7B1C` IC package with graphite gull-wing leads and one faceted ember crystal growing from its lid, agent observation
12. a 3D Wayam-orange `#FF7B1C` empty JEDEC component tray with a grid of vacant pockets, graphite frame, nothing to show

## Programs

Use on `/rfq`, `/quoting`, `/programs`, `/programs/[id]` and `/readiness` headers, the RFQ Agent card, and the program and SOP-hit-rate KPI tiles.

13. a 3D Wayam-orange `#FF7B1C` bound OEM RFQ pack: three thick document blocks strapped with a graphite band and one drawing tube on top, all blank
14. a 3D Wayam-orange `#FF7B1C` cost build-up staircase of six blocks rising to a taller graphite price column, quoting waterfall
15. a 3D Wayam-orange `#FF7B1C` ECU housing with cooling fins and a graphite sealed multi-pin connector, the program's product
16. a 3D Wayam-orange `#FF7B1C` launch gate: a factory traffic-light column with three lenses beside a raised graphite barrier arm, SOP readiness, no symbols on the lenses

## BOM and parts

Use on `/bom`, `/lifecycle` and `/should-cost` headers, and the lead-time and single-source KPI tiles on `/bom`, `/lifecycle`, `/suppliers` and `/dashboard`.

17. a 3D Wayam-orange `#FF7B1C` PCB panel of six boards with graphite break-off rails and tooling holes, bare copper pads as abstract dots, BOM
18. a 3D Wayam-orange `#FF7B1C` last-time-buy vault: a small safe with its door ajar showing stacked graphite component reels inside
19. a 3D Wayam-orange `#FF7B1C` hourglass fused into the hub of a graphite component reel, sand almost run out, lead time
20. a 3D Wayam-orange `#FF7B1C` die-cast housing cut cleanly in half to show its cross-section, held in the jaws of a graphite vernier caliper, should-cost
21. a 3D Wayam-orange `#FF7B1C` single FAKRA coax connector standing alone on a graphite plinth with an empty second plinth beside it, single source

## Sourcing

Use on `/suppliers`, `/suppliers/[id]`, `/supplier-risk`, `/sourcing-events`, `/purchase-orders`, `/contracts` and `/spend` headers, the matching agent cards on `/agents`, and the at-risk, in-transit and late-PO KPI tiles.

22. a 3D Wayam-orange `#FF7B1C` reel of SMD components with graphite carrier tape trailing off one side, pockets visible, supplier
23. a 3D Wayam-orange `#FF7B1C` silicon wafer on a graphite wafer chuck with one hairline crack running from the edge, supplier risk
24. a 3D Wayam-orange `#FF7B1C` balance scale with a graphite beam, one pan holding a connector and the other a taller stack of coins, bid comparison
25. a 3D Wayam-orange `#FF7B1C` purchase-order clipboard tablet with a graphite clip and three blank line bars, the last one ticked with a cut notch, not a letter
26. a 3D Wayam-orange `#FF7B1C` shipping crate strapped to a graphite pallet, corner protectors, in transit
27. a 3D Wayam-orange `#FF7B1C` supply agreement binder closed with a graphite wax bead on a ribbon, no writing, contract
28. a 3D Wayam-orange `#FF7B1C` pie of stacked coins cut into four wedges with one wedge pulled out on a graphite tray, spend by commodity

## Quality

Use on `/quality` and `/ppap` headers.

29. a 3D Wayam-orange `#FF7B1C` BGA solder joint cross-section under a graphite inspection microscope head, one ball visibly unwetted, root cause
30. a 3D Wayam-orange `#FF7B1C` thick PPAP binder with eighteen graphite index tabs down its edge and a blank warrant sheet clipped to the cover

## EMS network

Use on `/ems`, `/ems/capacity`, `/ems/performance` and `/ems/multi-tier` headers and on EMS partner cards.

31. a 3D Wayam-orange `#FF7B1C` pick-and-place head with four graphite vacuum nozzles, one nozzle holding a tiny chip, EMS partner
32. a 3D Wayam-orange `#FF7B1C` reflow-oven tunnel section with a PCB entering on a graphite mesh belt and a #C1460F glow inside, line capacity
33. a 3D Wayam-orange `#FF7B1C` stainless solder-paste stencil in a graphite tension frame with a squeegee blade resting on it, first-pass yield
34. a 3D Wayam-orange `#FF7B1C` three-tier node tree: one large orange node feeding two graphite mid nodes feeding four small nodes, one small node lit orange, sub-tier single point of failure

## Intelligence and administration

Use on `/copilot`, `/agents`, `/integrations` and `/settings` headers, the approvals inbox, and the Copilot and Invoice Validation agent cards.

35. a 3D Wayam-orange `#FF7B1C` faceted ember crystal hovering above a graphite stack of three record cards, grounded answer
36. a 3D Wayam-orange `#FF7B1C` autonomous tugger cart carrying one graphite tote along a guide rail, agent at work
37. a 3D Wayam-orange `#FF7B1C` approval stamp head hovering over a graphite ink pad, abstract ring seal on its face, no word
38. a 3D Wayam-orange `#FF7B1C` invoice slip, goods-receipt slip and order slip skewered on one graphite spike, three-way match, all blank
39. a 3D Wayam-orange `#FF7B1C` industrial circular connector plug seating into a graphite socket block, system integration
40. a 3D Wayam-orange `#FF7B1C` console panel of three graphite slide faders, one fader cap orange, settings

---

## How to generate

- One subject per image. Do not collage several of these into one render.
- Export **square PNG**, transparent if the tool allows, else `#101010` background so it sits on `bg-container`.
- Target **1024²**; the UI displays them at 28–44px on tiles and headers and 56–72px on empty states.
- If the model adds text, rerun with `no text, no letters, no numbers` at the end.
- If the orange drifts toward red or gold, append `hue locked to #FF7B1C, not red, not amber`.
- Do not generate OEM, supplier, semiconductor or ERP brand marks, and no IATF / ISO / AEC certification logos. Prompts 4, 13 and 27 stay blank and unbranded.
- Save each render under the filename below. Until a file exists the app shows the Lucide fallback glyph on an orange tile, so marks can be dropped in one at a time.

## Filenames

Numbering matches the list above and the order of `src/lib/marks.ts`.

| # | Mark id | File | Where it appears |
| --- | --- | --- | --- |
| 1 | `mark-stage-rfi` | `public/images/marks/mark-stage-rfi.png` | Pipeline stage tile: RFI Received |
| 2 | `mark-stage-rfq` | `public/images/marks/mark-stage-rfq.png` | Pipeline stage tile: RFQ Analysis |
| 3 | `mark-stage-quote` | `public/images/marks/mark-stage-quote.png` | Pipeline stage tile: Quote Submitted |
| 4 | `mark-stage-award` | `public/images/marks/mark-stage-award.png` | Pipeline stage tile: Program Awarded; awarded-revenue KPI on `/programs` |
| 5 | `mark-stage-bom` | `public/images/marks/mark-stage-bom.png` | Pipeline stage tile: BOM Finalised |
| 6 | `mark-stage-suppliers` | `public/images/marks/mark-stage-suppliers.png` | Pipeline stage tile: Suppliers Onboarded |
| 7 | `mark-stage-po` | `public/images/marks/mark-stage-po.png` | Pipeline stage tile: POs Placed |
| 8 | `mark-stage-production` | `public/images/marks/mark-stage-production.png` | Pipeline stage tile: Production Scheduled |
| 9 | `mark-stage-sop` | `public/images/marks/mark-stage-sop.png` | Pipeline stage tile: SOP Achieved; Next SOP KPI on `/programs` |
| 10 | `mark-command` | `public/images/marks/mark-command.png` | `/dashboard` header |
| 11 | `mark-observation` | `public/images/marks/mark-observation.png` | Agent observation cards on `/dashboard`, `/programs/[id]`, `/ems/performance` |
| 12 | `mark-empty` | `public/images/marks/mark-empty.png` | Empty states across the app |
| 13 | `mark-rfq-pack` | `public/images/marks/mark-rfq-pack.png` | `/rfq` header; RFQ Agent card on `/agents` |
| 14 | `mark-quote-build` | `public/images/marks/mark-quote-build.png` | `/quoting` header |
| 15 | `mark-program` | `public/images/marks/mark-program.png` | `/programs` and `/programs/[id]` headers; program KPIs |
| 16 | `mark-readiness` | `public/images/marks/mark-readiness.png` | `/readiness` header; SOP hit-rate and readiness KPIs |
| 17 | `mark-bom` | `public/images/marks/mark-bom.png` | `/bom` header; master-data KPI on `/integrations` |
| 18 | `mark-lifecycle` | `public/images/marks/mark-lifecycle.png` | `/lifecycle` header |
| 19 | `mark-lead-time` | `public/images/marks/mark-lead-time.png` | Lead-time KPIs on `/lifecycle`, `/bom`, `/dashboard`, `/readiness` |
| 20 | `mark-should-cost` | `public/images/marks/mark-should-cost.png` | `/should-cost` header |
| 21 | `mark-single-source` | `public/images/marks/mark-single-source.png` | Single-source KPIs on `/bom`, `/suppliers`, `/dashboard` |
| 22 | `mark-supplier` | `public/images/marks/mark-supplier.png` | `/suppliers` and `/suppliers/[id]` headers; Supplier Evaluation Agent card |
| 23 | `mark-supplier-risk` | `public/images/marks/mark-supplier-risk.png` | `/supplier-risk` header; at-risk KPIs; Risk Monitoring Agent card |
| 24 | `mark-sourcing-event` | `public/images/marks/mark-sourcing-event.png` | `/sourcing-events` header; Bid Comparison Agent card |
| 25 | `mark-po` | `public/images/marks/mark-po.png` | `/purchase-orders` header |
| 26 | `mark-shipment` | `public/images/marks/mark-shipment.png` | Late-PO and open-exception KPIs on `/purchase-orders` and `/dashboard` |
| 27 | `mark-contract` | `public/images/marks/mark-contract.png` | `/contracts` header; Contract Review Agent card; policy KPI on `/agents` |
| 28 | `mark-spend` | `public/images/marks/mark-spend.png` | `/spend` header; savings KPI on `/should-cost`; Spend Optimisation Agent card |
| 29 | `mark-quality` | `public/images/marks/mark-quality.png` | `/quality` header |
| 30 | `mark-ppap` | `public/images/marks/mark-ppap.png` | `/ppap` header |
| 31 | `mark-ems` | `public/images/marks/mark-ems.png` | `/ems` header and EMS partner cards |
| 32 | `mark-capacity` | `public/images/marks/mark-capacity.png` | `/ems/capacity` header |
| 33 | `mark-performance` | `public/images/marks/mark-performance.png` | `/ems/performance` header |
| 34 | `mark-multi-tier` | `public/images/marks/mark-multi-tier.png` | `/ems/multi-tier` header |
| 35 | `mark-copilot` | `public/images/marks/mark-copilot.png` | `/copilot` header and empty state; Copilot agent card |
| 36 | `mark-agents` | `public/images/marks/mark-agents.png` | `/agents` header; agent-runs KPI |
| 37 | `mark-approval` | `public/images/marks/mark-approval.png` | Approvals inbox on `/agents`; fixed-this-session KPI on `/integrations` |
| 38 | `mark-invoice` | `public/images/marks/mark-invoice.png` | Invoice Validation Agent card on `/agents` |
| 39 | `mark-integrations` | `public/images/marks/mark-integrations.png` | `/integrations` header |
| 40 | `mark-settings` | `public/images/marks/mark-settings.png` | `/settings` header |
