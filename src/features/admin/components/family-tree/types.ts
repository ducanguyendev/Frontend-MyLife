export interface HorizontalRelation {
  memberId: number;
  relationType: string;
}

export interface FamilyMember {
  id: number;
  fullName: string;
  generation: number;
  gender?: string;
  dateOfBirth?: string;
  role?: string;
  address?: string;
  phoneNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  avatarUrl?: string;
  biography?: string;
  fatherId?: number;
  motherId?: number;
  spouseId?: number;
  childIds?: number[];
  childNames?: string[];
  horizontalRelations?: HorizontalRelation[];
  createdAt: string;
  updatedAt: string;
}

export interface Generation {
  id: number;
  name: string;
  title?: string;
  description?: string;
}

export interface FamilyTreeManagerProps {
  showToast: (text: string, ok: boolean) => void;
  getHeaders: () => Record<string, string>;
}

export interface AnniversaryItem {
  id: string;
  title: string;
  relation: string;
  lunarDate: string;
  solarDate: string;
  daysLeft: string;
  place: string;
  host: string;
  notes: string;
  badgeColor: string;
}

export interface LibraryPhoto {
  id: string;
  title: string;
  category: string;
  year: string;
  url: string;
  desc: string;
  author: string;
}

export const removeVietnameseTones = (str: string): string => {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
};

export const getMemberAvatar = (m: FamilyMember): string => {
  if (m.avatarUrl && m.avatarUrl.startsWith("http")) {
    return m.avatarUrl;
  }
  const isFemale = m.gender?.toLowerCase() === "nữ";
  const num = Math.abs(String(m.id || m.fullName).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
  const femaleImgs = [5, 9, 10, 16, 20, 26, 32, 44, 47, 49];
  const maleImgs = [11, 12, 13, 15, 33, 53, 59, 60, 68, 70];
  const imgId = isFemale ? femaleImgs[num % femaleImgs.length] : maleImgs[num % maleImgs.length];
  return `https://i.pravatar.cc/300?img=${imgId}`;
};

export const getGenerationColors = (generation: number) => {
  const colors = [
    { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-800 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
    { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-800 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
    { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-800 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
    { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
    { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-800 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
    { bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-800 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800" },
    { bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-800 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
    { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-800 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
    { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-800 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
    { bg: "bg-cyan-100 dark:bg-cyan-900/40", text: "text-cyan-800 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" }
  ];
  const index = Math.max(0, generation - 1) % colors.length;
  return colors[index];
};
