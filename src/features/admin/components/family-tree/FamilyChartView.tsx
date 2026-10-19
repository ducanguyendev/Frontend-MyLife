import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as f3 from "family-chart";
import "family-chart/styles/family-chart.css";
import { Download, Focus, GitBranch, UsersRound, ZoomIn, ZoomOut } from "lucide-react";
import { toPng } from "html-to-image";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { adaptMembersToFamilyChart, escapeFamilyChartHtml, safeFamilyChartImageUrl } from "./familyChartAdapter";
import { adaptFamilyMembers, buildFamilyTreeIndex, chooseInitialFocus, getHiddenDescendantCount, getVisibleFamilyMembers } from "./familyTreeAdapter";
import type { FamilyMember } from "./types";
import type { Chart, Data, TreeDatum } from "family-chart";
import "./FamilyChartView.css";

interface FamilyChartViewProps {
  members: FamilyMember[];
  searchFocusMemberId?: number | null;
  generationFilterId?: number | null;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

interface FamilyChartActionHandlers {
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onFocus: (id: number) => void;
  onExpand: (id: number) => void;
  members: FamilyMember[];
}

function customCard(datum: TreeDatum): string {
  const data = datum.data.data;
  const name = escapeFamilyChartHtml(data.name);
  const role = escapeFamilyChartHtml(data.role);
  const generation = escapeFamilyChartHtml(data.labels?.generation);
  const year = escapeFamilyChartHtml(data.birthYear);
  const memorial = escapeFamilyChartHtml(data.memorial);
  const avatar = escapeFamilyChartHtml(safeFamilyChartImageUrl(data.avatar));
  const initial = escapeFamilyChartHtml(String(data.name ?? "?").trim().slice(0, 1).toLocaleUpperCase() || "?");
  const hiddenCount = Number(data.hiddenCount) || 0;
  return `<article class="mylife-fc-card${data.deceased ? " is-deceased" : ""}" data-member-id="${escapeFamilyChartHtml(datum.data.id)}">
    <div class="mylife-fc-card__portrait">${avatar ? `<img src="${avatar}" alt="${name}" />` : `<span>${initial}</span>`}</div>
    <button type="button" class="mylife-fc-card__name" data-family-chart-action="focus" title="Xem nhánh: ${name}">${name}</button>
    <div class="mylife-fc-card__role">${role}</div>
    <div class="mylife-fc-card__meta"><span>${generation}</span>${year ? `<span>${year}</span>` : ""}${data.deceased ? `<span class="mylife-fc-card__memorial">${memorial}</span>` : ""}</div>
    <div class="mylife-fc-card__actions">
      <button type="button" data-family-chart-action="view" title="${escapeFamilyChartHtml(data.labels.view)}">${escapeFamilyChartHtml(data.labels.view)}</button>
      <button type="button" data-family-chart-action="edit" title="${escapeFamilyChartHtml(data.labels.edit)}">${escapeFamilyChartHtml(data.labels.edit)}</button>
      <button type="button" data-family-chart-action="delete" title="${escapeFamilyChartHtml(data.labels.delete)}">•••</button>
      ${hiddenCount > 0 ? `<button type="button" class="mylife-fc-card__expand" data-family-chart-action="expand" title="${escapeFamilyChartHtml(data.expanded ? data.labels.collapse : data.labels.expand)}">${data.expanded ? "−" : `+${hiddenCount}`}</button>` : ""}
    </div>
  </article>`;
}

export const FamilyChartView: React.FC<FamilyChartViewProps> = ({ members, searchFocusMemberId, generationFilterId, onView, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const label = useCallback((key: string, fallback: string) => t(key, { defaultValue: fallback }), [t]);
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const initializedDataKeyRef = useRef("");
  const appliedFocusIdRef = useRef<string | null>(null);
  const actionHandlersRef = useRef<FamilyChartActionHandlers>({ onView, onEdit, onDelete, onFocus: () => {}, onExpand: () => {}, members });
  const treeMembers = useMemo(() => generationFilterId == null ? members : members.filter(member => member.generation === generationFilterId), [members, generationFilterId]);
  const treeIndex = useMemo(() => buildFamilyTreeIndex(treeMembers), [treeMembers]);
  const [focusedMemberId, setFocusedMemberId] = useState<number | null>(() => chooseInitialFocus(adaptFamilyMembers(treeMembers)));
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [showAllMembers, setShowAllMembers] = useState(false);
  const visibleMembers = useMemo(() => getVisibleFamilyMembers(treeMembers, focusedMemberId, expandedIds, showAllMembers, treeIndex), [treeMembers, focusedMemberId, expandedIds, showAllMembers, treeIndex]);
  const visibleIds = useMemo(() => new Set(visibleMembers.map(member => member.id)), [visibleMembers]);
  const hiddenCounts = useMemo(() => new Map(visibleMembers.map(member => [member.id, getHiddenDescendantCount(member, treeIndex, visibleIds)])), [visibleMembers, treeIndex, visibleIds]);
  const chartData = useMemo(() => adaptMembersToFamilyChart(visibleMembers, {
    hiddenCounts,
    expandedIds,
    labels: {
      view: label("admin.view_detail", "View details"),
      edit: label("admin.edit", "Edit"),
      delete: label("admin.delete", "Delete"),
      focus: label("admin.mindmap_focus_branch", "View this branch"),
      expand: count => t("admin.mindmap_expand_descendants", { count, defaultValue: `Show ${count} descendants` }),
      collapse: label("admin.mindmap_collapse", "Collapse"),
      generation: generation => t("admin.mindmap_generation", { generation, defaultValue: `Generation ${generation}` }),
    },
  }), [visibleMembers, hiddenCounts, expandedIds, label, t]);
  const dataKey = useMemo(() => JSON.stringify(chartData), [chartData]);

  const focusMember = useCallback((id: number) => {
    if (focusedMemberId !== id && focusedMemberId != null) setFocusHistory(history => [...history, focusedMemberId]);
    setFocusedMemberId(id);
    setExpandedIds(new Set());
    setShowAllMembers(false);
  }, [focusedMemberId]);
  const toggleExpanded = useCallback((id: number) => setExpandedIds(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);
  useEffect(() => { actionHandlersRef.current = { onView, onEdit, onDelete, onFocus: focusMember, onExpand: toggleExpanded, members }; }, [onView, onEdit, onDelete, focusMember, toggleExpanded, members]);

  useEffect(() => {
    if (treeMembers.length && !treeMembers.some(member => member.id === focusedMemberId)) setFocusedMemberId(chooseInitialFocus(adaptFamilyMembers(treeMembers)));
  }, [treeMembers, focusedMemberId]);
  useEffect(() => {
    if (searchFocusMemberId == null || !treeMembers.some(member => member.id === searchFocusMemberId)) return;
    focusMember(searchFocusMemberId);
  }, [searchFocusMemberId, treeMembers, focusMember]);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";
    const chart = f3.createChart(host, chartData as Data)
      .setCardXSpacing(92)
      .setCardYSpacing(112)
      .setTransitionTime(360)
      .setShowSiblingsOfMain(true);
    const card = chart.setCardHtml()
      .setCardDim({ w: 236, h: 176 })
      .setCardInnerHtmlCreator(customCard)
      .setOnHoverPathToMain();
    card.setOnCardClick((event: Event, datum: TreeDatum) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-family-chart-action]") : null;
      const id = Number(datum.data.id);
      const member = actionHandlersRef.current.members.find(item => item.id === id);
      if (target && member) {
        event.stopPropagation();
        const action = target.dataset.familyChartAction;
        if (action === "view") actionHandlersRef.current.onView(member);
        else if (action === "edit") actionHandlersRef.current.onEdit(member);
        else if (action === "delete") actionHandlersRef.current.onDelete(member);
        else if (action === "expand") actionHandlersRef.current.onExpand(id);
        else if (action === "focus") actionHandlersRef.current.onFocus(id);
        return;
      }
      if (Number.isInteger(id)) actionHandlersRef.current.onFocus(id);
    });
    chart.updateTree({ initial: true, tree_position: "main_to_middle" });
    chartRef.current = chart;
    initializedDataKeyRef.current = dataKey;
    appliedFocusIdRef.current = String(focusedMemberId ?? chartData[0]?.id ?? "");
    return () => { chartRef.current = null; host.innerHTML = ""; };
    // The library owns its DOM for the mounted POC; callbacks use a ref to keep current props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || initializedDataKeyRef.current === dataKey) return;
    chart.updateData(chartData as Data);
    chart.updateMainId(String(focusedMemberId ?? chartData[0]?.id ?? ""));
    chart.updateTree({ tree_position: "main_to_middle", transition_time: 360 });
    initializedDataKeyRef.current = dataKey;
    appliedFocusIdRef.current = String(focusedMemberId ?? chartData[0]?.id ?? "");
  }, [chartData, dataKey, focusedMemberId]);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !chartData.some(item => item.id === String(focusedMemberId)) || appliedFocusIdRef.current === String(focusedMemberId)) return;
    chart.updateMainId(String(focusedMemberId));
    chart.updateTree({ tree_position: "main_to_middle", transition_time: 360 });
    appliedFocusIdRef.current = String(focusedMemberId);
  }, [focusedMemberId, chartData]);

  const zoom = (amount: number) => { const chart = chartRef.current; if (chart) f3.handlers.manualZoom({ amount, svg: chart.svg, transition_time: 260 }); };
  const fitTree = () => chartRef.current?.updateTree({ tree_position: "fit", transition_time: 360 });
  const exportPng = async () => {
    const host = hostRef.current;
    if (!host) return;
    try {
      const png = await toPng(host, { pixelRatio: members.length > 100 ? 1.5 : 2, skipFonts: true });
      const link = document.createElement("a"); link.href = png; link.download = "mylife-family-chart-poc.png"; link.click();
    } catch (error) { console.error("Could not export the family chart image.", error); }
  };

  if (!members.length) return <div className="family-chart-poc__empty" role="status">{t("admin.mindmap_empty", { defaultValue: "Thêm thành viên để xem gia phả." })}</div>;
  return <section className="family-chart-poc" aria-label={label("admin.view_mindmap", "Cây gia phả")}>
    <div className="family-chart-poc__toolbar" role="toolbar" aria-label={label("admin.mindmap_toolbar", "Công cụ sơ đồ gia phả")}>
      {focusHistory.length > 0 && <button type="button" onClick={() => { const previous = focusHistory.at(-1); if (previous == null) return; setFocusHistory(items => items.slice(0, -1)); setFocusedMemberId(previous); setShowAllMembers(false); setExpandedIds(new Set()); }}>← {label("admin.mindmap_previous_branch", "Nhánh trước")}</button>}
      <button type="button" aria-label={label("admin.mindmap_zoom_out", "Thu nhỏ")} onClick={() => zoom(1 / 1.18)}><ZoomOut size={16} /></button>
      <button type="button" aria-label={label("admin.mindmap_zoom_in", "Phóng to")} onClick={() => zoom(1.18)}><ZoomIn size={16} /></button>
      <button type="button" aria-label={label("admin.mindmap_fit_view", "Vừa khung nhánh")} onClick={fitTree}><Focus size={16} /></button>
      <button type="button" aria-pressed={showAllMembers} onClick={() => { setShowAllMembers(value => !value); setExpandedIds(new Set()); }}><UsersRound size={16} />{showAllMembers ? label("admin.mindmap_current_branch", "Current branch") : label("admin.mindmap_all_tree", "Whole family")}</button>
      <button type="button" disabled title="Family Chart 0.9.0 does not render MyLife horizontal relations"><GitBranch size={16} />{label("admin.mindmap_extended_relations_short", "Extended relations")}</button>
      <button type="button" aria-label={label("admin.export_png", "Xuất PNG")} onClick={() => void exportPng()}><Download size={16} />PNG</button>
    </div>
    <div ref={hostRef} className="family-chart-poc__canvas f3" />
    <p className="family-chart-poc__note">Family Chart 0.9.0 · {visibleMembers.length} / {members.length} {label("admin.members", "people")} · {label("admin.mindmap_drag_hint", "Scroll to zoom · drag to pan")}</p>
  </section>;
};

export default FamilyChartView;
