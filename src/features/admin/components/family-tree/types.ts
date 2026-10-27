import { getGenerationCardTheme } from "./generationCardThemes";

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
  lifeStatus?: "LIVING" | "DECEASED";
  deathDate?: string | null;
  role?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationDisplayName?: string | null;
  locationSource?: "GEOCODED" | "MANUAL" | null;
  locationStatus?: "NO_ADDRESS" | "PENDING" | "LOCATED" | "FAILED" | "UNAVAILABLE";
  phoneNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  avatarUrl?: string;
  hasManagedAvatar?: boolean;
  avatarUpdatedAt?: string;
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
}

export interface LibraryPhoto {
  id: number;
  albumId: number;
  title: string;
  driveFileId?: string;
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

export const getGenerationColors = (generation: number) => {
  const theme = getGenerationCardTheme(generation);
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    origin: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-900 dark:text-amber-200", border: "border-amber-200 dark:border-amber-800" },
    branch: { bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-900 dark:text-sky-200", border: "border-sky-200 dark:border-sky-800" },
    leaf: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-900 dark:text-emerald-200", border: "border-emerald-200 dark:border-emerald-800" },
    blossom: { bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-900 dark:text-violet-200", border: "border-violet-200 dark:border-violet-800" },
  };
  return colors[theme.key] ?? { bg: theme.badgeClassName, text: "", border: "" };
};
