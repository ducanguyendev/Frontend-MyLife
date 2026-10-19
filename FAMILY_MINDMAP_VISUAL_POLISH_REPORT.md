# Family Mindmap Visual Polish

## Thay đổi
- `src/features/admin/components/family-tree/FamilyMindmap.css`: làm ấm canvas, thêm hệ nét trung tính/focus thống nhất, làm mảnh connector và sibling rail, làm dịu nhánh inactive; tăng độ nổi, kích thước avatar/tên, hoàn thiện nhãn thế hệ, toolbar và hover.
- `src/features/admin/components/family-tree/FamilyMindmap.tsx`: thêm nền chấm rất nhẹ, bo chuyển hướng connector bằng smooth-step path, đồng bộ focus cho quan hệ mở rộng.
- `src/features/admin/components/family-tree/familyMindmapGraph.ts`: bỏ stroke inline gây cạnh tranh CSS; mỗi child-drop chỉ gắn với đúng child để focus không làm đậm các nhánh anh chị em không liên quan.
- `tests/family-mindmap-graph.test.cjs`, `tests/family-mindmap-node.test.cjs`: cập nhật assertion avatar và thêm kiểm tra ownership/stroke connector.

## Kiểm tra
- `node --test tests/family-mindmap-graph.test.cjs tests/family-mindmap-node.test.cjs`: 15/15 đạt.
- `npm.cmd run build`: đạt.

## Cần review
- Xem trực tiếp trên `/familytree` với cây nhỏ/lớn, hover/focus, chế độ quan hệ mở rộng và PNG trong trình duyệt thực tế để tinh chỉnh cảm quan theo dữ liệu thật.
