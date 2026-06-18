export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      phong_ban: TableDefinition<
        {
          id: number;
          ma_phong_ban: string | null;
          ten_phong_ban: string;
          ghi_chu: string | null;
        },
        {
          id?: number;
          ma_phong_ban?: string | null;
          ten_phong_ban: string;
          ghi_chu?: string | null;
        }
      >;
      loai_thiet_bi: TableDefinition<
        {
          id: number;
          ma_loai: string | null;
          ten_loai: string;
          ghi_chu: string | null;
        },
        {
          id?: number;
          ma_loai?: string | null;
          ten_loai: string;
          ghi_chu?: string | null;
        }
      >;
      hang_model: TableDefinition<
        {
          id: number;
          ten_hang: string;
          ten_model: string | null;
          ghi_chu: string | null;
        },
        {
          id?: number;
          ten_hang: string;
          ten_model?: string | null;
          ghi_chu?: string | null;
        }
      >;
      he_dieu_hanh: TableDefinition<
        {
          id: number;
          ten_he_dieu_hanh: string;
          phien_ban: string | null;
        },
        {
          id?: number;
          ten_he_dieu_hanh: string;
          phien_ban?: string | null;
        }
      >;
      phan_mem_diet_virus: TableDefinition<
        {
          id: number;
          ten_phan_mem: string;
          phien_ban: string | null;
        },
        {
          id?: number;
          ten_phan_mem: string;
          phien_ban?: string | null;
        }
      >;
      tinh_trang_thiet_bi: TableDefinition<
        {
          id: number;
          ma_tinh_trang: string | null;
          ten_tinh_trang: string;
          ghi_chu: string | null;
        },
        {
          id?: number;
          ma_tinh_trang?: string | null;
          ten_tinh_trang: string;
          ghi_chu?: string | null;
        }
      >;
      nguon_goc_tai_san: TableDefinition<
        {
          id: number;
          ma_nguon_goc: string | null;
          ten_nguon_goc: string;
          ghi_chu: string | null;
        },
        {
          id?: number;
          ma_nguon_goc?: string | null;
          ten_nguon_goc: string;
          ghi_chu?: string | null;
        }
      >;
      nguoi_dung: TableDefinition<
        {
          id: number;
          phong_ban_id: number | null;
          ho_ten: string;
          ten_dang_nhap: string;
          email: string | null;
          so_dien_thoai: string | null;
          vai_tro: string;
          trang_thai: boolean;
          auth_user_id: string | null;
        },
        {
          id?: number;
          phong_ban_id?: number | null;
          ho_ten: string;
          ten_dang_nhap: string;
          email?: string | null;
          so_dien_thoai?: string | null;
          vai_tro?: string;
          trang_thai?: boolean;
          auth_user_id?: string | null;
        }
      >;
      thiet_bi: TableDefinition<
        {
          id: number;
          ma_thiet_bi: string;
          ten_thiet_bi: string;
          loai_thiet_bi_id: number;
          hang_model_id: number | null;
          serial: string | null;
          nam_trang_bi: number | null;
          ngay_tiep_nhan: string | null;
          nguon_goc_id: number | null;
          tinh_trang_id: number | null;
          phong_ban_id: number | null;
          nguoi_su_dung_id: number | null;
          la_thiet_bi_dung_chung: boolean | null;
          thiet_bi_mat: boolean | null;
          dap_ung_cds: boolean;
          nhom_cds: string | null;
          ghi_chu: string | null;
        },
        {
          id?: number;
          ma_thiet_bi: string;
          ten_thiet_bi: string;
          loai_thiet_bi_id: number;
          hang_model_id?: number | null;
          serial?: string | null;
          nam_trang_bi?: number | null;
          ngay_tiep_nhan?: string | null;
          nguon_goc_id?: number | null;
          tinh_trang_id?: number | null;
          phong_ban_id?: number | null;
          nguoi_su_dung_id?: number | null;
          la_thiet_bi_dung_chung?: boolean | null;
          thiet_bi_mat?: boolean | null;
          dap_ung_cds?: boolean;
          nhom_cds?: string | null;
          ghi_chu?: string | null;
        }
      >;
      he_thong_cau_hinh: TableDefinition<
        {
          key: string;
          value: Json;
          mo_ta: string | null;
          updated_at: string;
        },
        {
          key: string;
          value: Json;
          mo_ta?: string | null;
          updated_at?: string;
        }
      >;
      cau_hinh_may_tinh: TableDefinition<
        {
          id: number;
          thiet_bi_id: number;
          mainboard: string | null;
          cpu: string | null;
          ram: string | null;
          o_cung: string | null;
          man_hinh: string | null;
          he_dieu_hanh_id: number | null;
          phan_mem_diet_virus_id: number | null;
          ghi_chu: string | null;
        },
        {
          id?: number;
          thiet_bi_id: number;
          mainboard?: string | null;
          cpu?: string | null;
          ram?: string | null;
          o_cung?: string | null;
          man_hinh?: string | null;
          he_dieu_hanh_id?: number | null;
          phan_mem_diet_virus_id?: number | null;
          ghi_chu?: string | null;
        }
      >;
      lich_su_ban_giao: TableDefinition<
        {
          id: number;
          thiet_bi_id: number;
          nguoi_nhan_id: number | null;
          phong_ban_nhan_id: number | null;
          ngay_ban_giao: string;
          ngay_thu_hoi: string | null;
          hinh_thuc: string | null;
          noi_dung: string | null;
          ghi_chu: string | null;
        },
        {
          id?: number;
          thiet_bi_id: number;
          nguoi_nhan_id?: number | null;
          phong_ban_nhan_id?: number | null;
          ngay_ban_giao: string;
          ngay_thu_hoi?: string | null;
          hinh_thuc?: string | null;
          noi_dung?: string | null;
          ghi_chu?: string | null;
        }
      >;
      sua_chua_bao_tri: TableDefinition<
        {
          id: number;
          thiet_bi_id: number;
          ngay_ghi_nhan: string;
          ngay_sua_chua: string | null;
          loai_xu_ly: string | null;
          mo_ta_loi: string | null;
          ket_qua_xu_ly: string | null;
          chi_phi: number | null;
          don_vi_sua_chua: string | null;
          ghi_chu: string | null;
        },
        {
          id?: number;
          thiet_bi_id: number;
          ngay_ghi_nhan: string;
          ngay_sua_chua?: string | null;
          loai_xu_ly?: string | null;
          mo_ta_loi?: string | null;
          ket_qua_xu_ly?: string | null;
          chi_phi?: number | null;
          don_vi_sua_chua?: string | null;
          ghi_chu?: string | null;
        }
      >;
      thiet_bi_chung_thu_so: TableDefinition<
        {
          id: number;
          thiet_bi_id: number;
          nguoi_su_dung_id: number;
          so_hieu_chung_thu_so: string;
          email: string | null;
          ten_chung_thu_so: string | null;
          loai_chung_thu_so: string | null;
          to_chuc: string | null;
          thong_tin_chung: string | null;
          id_chung_thu_so_nguon: string | null;
          da_gia_han: boolean;
          la_hien_hanh: boolean;
          chung_thu_goc_id: number | null;
          chung_thu_thay_the_id: number | null;
          ngay_hieu_luc: string;
          ngay_het_hieu_luc: string;
          han_gia_han_lan_dau: string | null;
          thoi_diem_gia_han_gan_nhat: string | null;
          thoi_diem_thay_doi_thong_tin_gan_nhat: string | null;
          thoi_diem_thu_hoi: string | null;
          ly_do_thu_hoi: string | null;
          ghi_chu: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: number;
          thiet_bi_id: number;
          nguoi_su_dung_id: number;
          so_hieu_chung_thu_so: string;
          email?: string | null;
          ten_chung_thu_so?: string | null;
          loai_chung_thu_so?: string | null;
          to_chuc?: string | null;
          thong_tin_chung?: string | null;
          id_chung_thu_so_nguon?: string | null;
          da_gia_han?: boolean;
          la_hien_hanh?: boolean;
          chung_thu_goc_id?: number | null;
          chung_thu_thay_the_id?: number | null;
          ngay_hieu_luc: string;
          ngay_het_hieu_luc: string;
          han_gia_han_lan_dau?: string | null;
          thoi_diem_gia_han_gan_nhat?: string | null;
          thoi_diem_thay_doi_thong_tin_gan_nhat?: string | null;
          thoi_diem_thu_hoi?: string | null;
          ly_do_thu_hoi?: string | null;
          ghi_chu?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      lich_su_chung_thu_so: TableDefinition<
        {
          id: number;
          thiet_bi_chung_thu_so_id: number | null;
          thiet_bi_id: number;
          loai_su_kien: string;
          thoi_diem_su_kien: string;
          nguoi_su_dung_id_truoc: number | null;
          nguoi_su_dung_id_sau: number | null;
          so_hieu_chung_thu_so_truoc: string | null;
          so_hieu_chung_thu_so_sau: string | null;
          email_truoc: string | null;
          email_sau: string | null;
          ten_chung_thu_so_truoc: string | null;
          ten_chung_thu_so_sau: string | null;
          to_chuc_truoc: string | null;
          to_chuc_sau: string | null;
          thong_tin_chung_truoc: string | null;
          thong_tin_chung_sau: string | null;
          noi_dung_thay_doi: string | null;
          thong_tin_moi: string | null;
          ly_do_thu_hoi: string | null;
          mau_van_ban: string | null;
          ngay_hieu_luc_truoc: string | null;
          ngay_hieu_luc_sau: string | null;
          ngay_het_hieu_luc_truoc: string | null;
          ngay_het_hieu_luc_sau: string | null;
          ghi_chu: string | null;
          created_at: string;
        },
        {
          id?: number;
          thiet_bi_chung_thu_so_id?: number | null;
          thiet_bi_id: number;
          loai_su_kien: string;
          thoi_diem_su_kien?: string;
          nguoi_su_dung_id_truoc?: number | null;
          nguoi_su_dung_id_sau?: number | null;
          so_hieu_chung_thu_so_truoc?: string | null;
          so_hieu_chung_thu_so_sau?: string | null;
          email_truoc?: string | null;
          email_sau?: string | null;
          ten_chung_thu_so_truoc?: string | null;
          ten_chung_thu_so_sau?: string | null;
          to_chuc_truoc?: string | null;
          to_chuc_sau?: string | null;
          thong_tin_chung_truoc?: string | null;
          thong_tin_chung_sau?: string | null;
          noi_dung_thay_doi?: string | null;
          thong_tin_moi?: string | null;
          ly_do_thu_hoi?: string | null;
          mau_van_ban?: string | null;
          ngay_hieu_luc_truoc?: string | null;
          ngay_hieu_luc_sau?: string | null;
          ngay_het_hieu_luc_truoc?: string | null;
          ngay_het_hieu_luc_sau?: string | null;
          ghi_chu?: string | null;
          created_at?: string;
        }
      >;
      cau_hinh_van_ban_chung_thu_so: TableDefinition<
        {
          id: number;
          ten_co_quan_chu_quan: string | null;
          ten_co_quan: string | null;
          so_van_ban_mac_dinh: string | null;
          dia_diem: string | null;
          nguoi_dau_moi: string | null;
          so_dinh_danh: string | null;
          ngay_cap_dinh_danh: string | null;
          noi_cap_dinh_danh: string | null;
          chuc_vu_dau_moi: string | null;
          dien_thoai_dau_moi: string | null;
          email_dau_moi: string | null;
          dia_chi_tiep_nhan: string | null;
          nguoi_ky: string | null;
          chuc_vu_nguoi_ky: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: number;
          ten_co_quan_chu_quan?: string | null;
          ten_co_quan?: string | null;
          so_van_ban_mac_dinh?: string | null;
          dia_diem?: string | null;
          nguoi_dau_moi?: string | null;
          so_dinh_danh?: string | null;
          ngay_cap_dinh_danh?: string | null;
          noi_cap_dinh_danh?: string | null;
          chuc_vu_dau_moi?: string | null;
          dien_thoai_dau_moi?: string | null;
          email_dau_moi?: string | null;
          dia_chi_tiep_nhan?: string | null;
          nguoi_ky?: string | null;
          chuc_vu_nguoi_ky?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
    };
    Views: {
      v_bao_cao_chung_thu_so: {
        Row: {
          thiet_bi_chung_thu_so_id: number | null;
          thiet_bi_id: number | null;
          so_hieu_thiet_bi: string | null;
          ten_thiet_bi: string | null;
          loai_thiet_bi_id: number | null;
          loai_thiet_bi: string | null;
          nguoi_su_dung_id: number | null;
          nguoi_su_dung: string | null;
          phong_ban_id: number | null;
          ten_phong_ban: string | null;
          so_hieu_chung_thu_so: string | null;
          email: string | null;
          ten_chung_thu_so: string | null;
          loai_chung_thu_so: string | null;
          to_chuc: string | null;
          thong_tin_chung: string | null;
          id_chung_thu_so_nguon: string | null;
          da_gia_han: boolean | null;
          la_hien_hanh: boolean | null;
          chung_thu_goc_id: number | null;
          chung_thu_thay_the_id: number | null;
          ngay_hieu_luc: string | null;
          ngay_het_hieu_luc: string | null;
          han_gia_han_lan_dau: string | null;
          thoi_diem_gia_han_gan_nhat: string | null;
          thoi_diem_thay_doi_thong_tin_gan_nhat: string | null;
          thoi_diem_thu_hoi: string | null;
          ly_do_thu_hoi: string | null;
          ngay_can_thu_hoi: string | null;
          so_ngay_con_lai: number | null;
          trang_thai: string | null;
          ghi_chu: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      gen_ma_phong_ban: {
        Args: Record<string, never>;
        Returns: string;
      };
      gen_ma_thiet_bi: {
        Args: Record<string, never>;
        Returns: string;
      };
      gen_ma_nhan_su: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];

export type ViewRows<ViewName extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][ViewName]["Row"];
