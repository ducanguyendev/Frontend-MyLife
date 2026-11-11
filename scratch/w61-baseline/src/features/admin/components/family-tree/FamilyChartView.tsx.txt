import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as f3 from "family-chart";
import "family-chart/styles/family-chart.css";
import { Download, Focus, GitBranch, UsersRound, ZoomIn, ZoomOut } from "lucide-react";
import { toPng } from "html-to-image";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { adaptMembersToFamilyChart, createFamilyChartCardHtml } from "./familyChartAdapter";
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
  onRuntimeError: (error: Error) => void;
}

interface FamilyChartActionHandlers {
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onFocus: (id: number) => void;
  onExpand: (id: number) => void;
  members: FamilyMember[];
}

export const FamilyChartView: React.FC<FamilyChartViewProps> = ({ members, searchFocusMemberId, generationFilterId, onView, onEdit, onDelete, onRuntimeError }) => {
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
  const [runtimeError, setRuntimeError] = useState<Error | null>(null);
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

  const captureRuntimeError = useCallback((failure: unknown) => {
    const error = failure instanceof Error ? failure : new Error(String(failure));
    setRuntimeError(error);
  }, []);

  useEffect(() => {
    if (runtimeError) onRuntimeError(runtimeError);
  }, [runtimeError, onRuntimeError]);

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
    if (!host || chartData.length === 0 || runtimeError) return;
    host.innerHTML = "";
    try {
      const chart = f3.createChart(host, chartData as Data)
        .setSingleParentEmptyCard(false)
        .setCardXSpacing(92)
        .setCardYSpacing(112)
        .setTransitionTime(360)
        .setShowSiblingsOfMain(true);
      const card = chart.setCardHtml()
        .setCardDim({ w: 236, h: 176 })
        .setCardInnerHtmlCreator(createFamilyChartCardHtml)
        .setOnHoverPathToMain();
      card.setOnCardClick((event: Event, datum: TreeDatum) => {
        try {
          const target = typeof Element !== "undefined" && event.target instanceof Element
            ? event.target.closest<HTMLButtonElement>("[data-family-chart-action]")
            : null;
          const id = Number(datum?.data?.id);
          if (!Number.isSafeInteger(id)) return;
          const member = actionHandlersRef.current.members.find(item => item.id === id);
          if (!member) return;
          if (target) {
            event.stopPropagation();
            const action = target.dataset.familyChartAction;
            if (action === "view") actionHandlersRef.current.onView(member);
            else if (action === "edit") actionHandlersRef.current.onEdit(member);
            else if (action === "delete") actionHandlersRef.current.onDelete(member);
            else if (action === "expand") actionHandlersRef.current.onExpand(id);
            else if (action === "focus") actionHandlersRef.current.onFocus(id);
            return;
          }
          actionHandlersRef.current.onFocus(id);
        } catch (error) {
          captureRuntimeError(error);
        }
      });
      chart.updateTree({ initial: true, tree_position: "main_to_middle" });
      chartRef.current = chart;
      initializedDataKeyRef.current = dataKey;
      appliedFocusIdRef.current = chartData.some(item => item.id === String(focusedMemberId)) ? String(focusedMemberId) : chartData[0].id;
    } catch (error) {
      chartRef.current = null;
      host.innerHTML = "";
      captureRuntimeError(error);
    }
    return () => {
      chartRef.current = null;
      host.innerHTML = "";
    };
    // Chart creation intentionally occurs once per renderer mount; later data changes use updateData.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureRuntimeError, chartData.length, runtimeError]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || chartData.length === 0 || initializedDataKeyRef.current === dataKey || runtimeError) return;
    try {
      chart.updateData(chartData as Data);
      const focusId = chartData.some(item => item.id === String(focusedMemberId)) ? String(focusedMemberId) : chartData[0].id;
      chart.updateMainId(focusId);
      chart.updateTree({ tree_position: "main_to_middle", transition_time: 360 });
      initializedDataKeyRef.current = dataKey;
      appliedFocusIdRef.current = focusId;
    } catch (error) {
      captureRuntimeError(error);
    }
  }, [chartData, dataKey, focusedMemberId, runtimeError, captureRuntimeError]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || chartData.length === 0 || runtimeError) return;
    const focusId = chartData.some(item => item.id === String(focusedMemberId)) ? String(focusedMemberId) : chartData[0].id;
    if (appliedFocusIdRef.current === focusId) return;
    try {
      chart.updateMainId(focusId);
      chart.updateTree({ tree_position: "main_to_middle", transition_time: 360 });
      appliedFocusIdRef.current = focusId;
    } catch (error) {
      captureRuntimeError(error);
    }
  }, [focusedMemberId, chartData, runtimeError, captureRuntimeError]);

  useEffect(() => {
    if (chartData.length > 0) return;
    chartRef.current = null;
    if (hostRef.current) hostRef.current.innerHTML = "";
  }, [chartData.length]);

  const zoom = (amount: number) => { const chart = chartRef.current; if (chart) { try { f3.handlers.manualZoom({ amount, svg: chart.svg, transition_time: 260 }); } catch (error) { captureRuntimeError(error); } } };
  const fitTree = () => { try { chartRef.current?.updateTree({ tree_position: "fit", transition_time: 360 }); } catch (error) { captureRuntimeError(error); } };
  const exportPng = async () => {
    const host = hostRef.current;
    if (!host) return;
    try {
      const png = await toPng(host, { pixelRatio: members.length > 100 ? 1.5 : 2, skipFonts: true });
      const link = document.createElement("a"); link.href = png; link.download = "mylife-family-chart-poc.png"; link.click();
    } catch (error) { console.error("Could not export the family chart image.", error); }
  };

  if (runtimeError) return <div className="family-chart-poc__empty" role="status">{t("admin.library_ui.loading")}</div>;
  if (!members.length || !chartData.length) return <div className="family-chart-poc__empty" role="status">{t("admin.mindmap_empty", { defaultValue: "Add family members to see the tree." })}</div>;
  return <section className="family-chart-poc" aria-label={label("admin.view_mindmap", "Family tree")}>
    <div className="family-chart-poc__toolbar" role="toolbar" aria-label={label("admin.mindmap_toolbar", "Family tree tools")}>
      {focusHistory.length > 0 && <button type="button" onClick={() => { const previous = focusHistory.at(-1); if (previous == null) return; setFocusHistory(items => items.slice(0, -1)); setFocusedMemberId(previous); setShowAllMembers(false); setExpandedIds(new Set()); }}>← {label("admin.mindmap_previous_branch", "Previous branch")}</button>}
      <button type="button" aria-label={label("admin.mindmap_zoom_out", "Zoom out")} onClick={() => zoom(1 / 1.18)}><ZoomOut size={16} /></button>
      <button type="button" aria-label={label("admin.mindmap_zoom_in", "Zoom in")} onClick={() => zoom(1.18)}><ZoomIn size={16} /></button>
      <button type="button" aria-label={label("admin.mindmap_fit_view", "Fit view")} onClick={fitTree}><Focus size={16} /></button>
      <button type="button" aria-pressed={showAllMembers} onClick={() => { setShowAllMembers(value => !value); setExpandedIds(new Set()); }}><UsersRound size={16} />{showAllMembers ? label("admin.mindmap_current_branch", "Current branch") : label("admin.mindmap_all_tree", "Whole family")}</button>
      <button type="button" disabled title="Family Chart 0.9.0 does not render MyLife horizontal relations"><GitBranch size={16} />{label("admin.mindmap_extended_relations_short", "Extended relations")}</button>
      <button type="button" aria-label={label("admin.export_png", "Export PNG")} onClick={() => void exportPng()}><Download size={16} />PNG</button>
    </div>
    <div ref={hostRef} className="family-chart-poc__canvas f3" />
    <p className="family-chart-poc__note">Family Chart 0.9.0 · {visibleMembers.length} / {members.length} {label("admin.members", "people")} · {label("admin.mindmap_drag_hint", "Scroll to zoom · drag to pan")}</p>
  </section>;
};

export default FamilyChartView;
