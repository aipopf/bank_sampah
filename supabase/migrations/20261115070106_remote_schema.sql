SET local check_function_bodies = off;

CREATE TABLE "public"."audit_log" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"    uuid,
  "aktivitas"  text                     NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "audit_log_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."audit_log"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."detail_setoran" (
  "id"              bigint        GENERATED ALWAYS AS IDENTITY NOT NULL,
  "setoran_id"      bigint,
  "jenis_sampah_id" bigint,
  "berat"           numeric(12,2) NOT NULL,
  "harga_per_kg"    numeric(12,2) NOT NULL,
  "subtotal"        numeric(14,2) NOT NULL,
  CONSTRAINT "detail_setoran_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."detail_setoran"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."jenis_sampah" (
  "id"           bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "nama_sampah"  character varying(100)   NOT NULL,
  "harga_per_kg" numeric(12,2)            NOT NULL DEFAULT 0,
  "satuan"       character varying(20)    DEFAULT 'kg'::character varying,
  "created_at"   timestamp with time zone DEFAULT now(),
  "is_active"    boolean                  NOT NULL DEFAULT true,
  CONSTRAINT "jenis_sampah_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."jenis_sampah"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."penarikan" (
  "id"                  bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "nasabah_id"          uuid,
  "jumlah"              numeric(14,2)            NOT NULL,
  "tanggal_penarikan"   timestamp with time zone DEFAULT now(),
  "status"              character varying(20)    DEFAULT 'menunggu'::character varying,
  "created_at"          timestamp with time zone DEFAULT now(),
  "status_pembayaran"   character varying        NOT NULL DEFAULT 'menunggu'::character varying,
  "petugas_pembayar_id" uuid,
  "dibayar_at"          timestamp with time zone,
  CONSTRAINT "penarikan_pkey" PRIMARY KEY (id),
  CONSTRAINT "penarikan_status_pembayaran_check" CHECK (((status_pembayaran)::text = ANY ((ARRAY['menunggu'::character varying, 'dibayar'::character varying])::text[]))),
  CONSTRAINT "penarikan_status_values_check" CHECK (((status IS
    NOT NULL) AND ((status)::text = ANY ((ARRAY['menunggu'::character varying, 'disetujui'::character varying, 'ditolak'::character varying])::text[]))))
);

ALTER TABLE "public"."penarikan"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"            uuid                     NOT NULL,
  "nama"          character varying(100)   NOT NULL,
  "email"         character varying(255),
  "nomor_telepon" character varying(20),
  "alamat"        text,
  "role"          character varying(20)    NOT NULL DEFAULT 'nasabah'::character varying,
  "created_at"    timestamp with time zone DEFAULT now(),
  "saldo"         numeric                  NOT NULL DEFAULT 0,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'petugas'::character varying, 'nasabah'::character varying])::text[]))),
  CONSTRAINT "profiles_saldo_nonnegative_check" CHECK ((saldo >= (0)::numeric))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."setoran" (
  "id"              bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "nasabah_id"      uuid,
  "petugas_id"      uuid,
  "tanggal_setoran" timestamp with time zone DEFAULT now(),
  "total_berat"     numeric(12,2)            DEFAULT 0,
  "total_harga"     numeric(14,2)            DEFAULT 0,
  "status"          character varying(20)    DEFAULT 'menunggu'::character varying,
  "created_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "setoran_pkey" PRIMARY KEY (id),
  CONSTRAINT "setoran_status_values_check" CHECK (((status IS
    NOT NULL) AND
    ((status)::text = ANY ((ARRAY['menunggu'::character varying, 'disetujui'::character varying, 'ditolak'::character varying, 'dibatalkan'::character varying])::text[]))))
);

ALTER TABLE "public"."setoran"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.ajukan_penarikan (
  p_jumlah numeric
)
  RETURNS public.penarikan
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_user_id uuid := (SELECT auth.uid());
    v_role text;
    v_saldo numeric;
    v_penarikan public.penarikan;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '28000',
            MESSAGE = 'Sesi autentikasi diperlukan.';
    END IF;

    -- Validasi nominal
    IF p_jumlah IS NULL
       OR p_jumlah <= 0
       OR p_jumlah::text IN ('NaN', 'Infinity', '-Infinity') THEN
        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = 'Nominal penarikan harus lebih besar dari nol dan valid.';
    END IF;

    -- Kunci profil untuk mencegah penarikan bersamaan
    SELECT lower(btrim(profile.role::text))
    INTO v_role
    FROM public.profiles AS profile
    WHERE profile.id = v_user_id
    FOR UPDATE;

    IF NOT FOUND OR v_role IS DISTINCT FROM 'nasabah' THEN
        RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'Hanya nasabah yang dapat melakukan penarikan.';
    END IF;

    -- Hitung saldo tersedia dari transaksi
    SELECT
        COALESCE((
            SELECT SUM(s.total_harga)
            FROM public.setoran AS s
            WHERE s.nasabah_id = v_user_id
              AND s.status = 'disetujui'
        ), 0)
        -
        COALESCE((
            SELECT SUM(w.jumlah)
            FROM public.penarikan AS w
            WHERE w.nasabah_id = v_user_id
              AND w.status IN ('menunggu', 'disetujui')
        ), 0)
    INTO v_saldo;

    IF p_jumlah > v_saldo THEN
        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = 'Saldo tersedia tidak mencukupi.';
    END IF;

    -- Penarikan langsung disetujui
    INSERT INTO public.penarikan (
        nasabah_id,
        jumlah,
        tanggal_penarikan,
        status,
        status_pembayaran,
        created_at
    )
    VALUES (
        v_user_id,
        p_jumlah,
        CURRENT_TIMESTAMP,
        'disetujui',
        'menunggu',
        CURRENT_TIMESTAMP
    )
    RETURNING * INTO v_penarikan;

    RETURN v_penarikan;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."ajukan_penarikan"(numeric) FROM PUBLIC, "anon", "service_role";

CREATE OR REPLACE FUNCTION public.atur_status_jenis_sampah (
  p_id        bigint,
  p_is_active boolean
)
  RETURNS public.jenis_sampah
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_result public.jenis_sampah;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Hanya admin yang dapat mengubah status jenis sampah.';
    END IF;

    IF p_id IS NULL OR p_is_active IS NULL THEN
        RAISE EXCEPTION 'Parameter tidak valid.';
    END IF;

    UPDATE public.jenis_sampah
    SET is_active = p_is_active
    WHERE id = p_id
    RETURNING * INTO v_result;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jenis sampah tidak ditemukan.';
    END IF;

    INSERT INTO public.audit_log (user_id, aktivitas)
    VALUES (
        auth.uid(),
        CASE
            WHEN p_is_active THEN 'Mengaktifkan jenis sampah ID '
            ELSE 'Menonaktifkan jenis sampah ID '
        END || p_id::text
    );

    RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."atur_status_jenis_sampah"(bigint, boolean) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.batalkan_setoran (
  p_setoran_id bigint
)
  RETURNS public.setoran
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_user_id uuid := (SELECT auth.uid());
    v_setoran public.setoran;
    v_total_penarikan numeric := 0;
    v_total_setoran_lain numeric := 0;
    v_saldo_setelah numeric := 0;
BEGIN
    -- 1. Validasi admin
    IF v_user_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Hanya admin yang dapat membatalkan setoran.';
    END IF;

    IF p_setoran_id IS NULL THEN
        RAISE EXCEPTION 'ID setoran tidak valid.';
    END IF;

    -- 2. Kunci transaksi setoran
    SELECT s.*
    INTO v_setoran
    FROM public.setoran s
    WHERE s.id = p_setoran_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Setoran tidak ditemukan.';
    END IF;

    IF v_setoran.status = 'dibatalkan' THEN
        RAISE EXCEPTION 'Setoran sudah dibatalkan.';
    END IF;

    IF v_setoran.status NOT IN ('menunggu', 'disetujui') THEN
        RAISE EXCEPTION 'Status setoran tidak dapat dibatalkan.';
    END IF;

    -- 3. Kunci profil nasabah
    PERFORM 1
    FROM public.profiles p
    WHERE p.id = v_setoran.nasabah_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil nasabah tidak ditemukan.';
    END IF;

    -- 4. Hitung saldo setelah pembatalan
    SELECT COALESCE(SUM(s.total_harga), 0)
    INTO v_total_setoran_lain
    FROM public.setoran s
    WHERE s.nasabah_id = v_setoran.nasabah_id
      AND s.status = 'disetujui'
      AND s.id <> p_setoran_id;

    SELECT COALESCE(SUM(p.jumlah), 0)
    INTO v_total_penarikan
    FROM public.penarikan p
    WHERE p.nasabah_id = v_setoran.nasabah_id
      AND p.status IN ('menunggu', 'disetujui');

    v_saldo_setelah :=
        v_total_setoran_lain - v_total_penarikan;

    IF v_saldo_setelah < 0 THEN
        RAISE EXCEPTION
            'Pembatalan ditolak. Saldo nasabah akan negatif. Saldo setelah pembatalan: %',
            v_saldo_setelah;
    END IF;

    -- 5. Ubah status setoran
    UPDATE public.setoran
    SET status = 'dibatalkan'
    WHERE id = p_setoran_id
    RETURNING * INTO v_setoran;

    -- 6. Catat audit
    INSERT INTO public.audit_log (user_id, aktivitas)
    VALUES (
        v_user_id,
        format(
            'Membatalkan setoran #%s milik nasabah %s. Nilai setoran: %s. Saldo setelah pembatalan: %s.',
            p_setoran_id,
            v_setoran.nasabah_id,
            v_setoran.total_harga,
            v_saldo_setelah
        )
    );

    RETURN v_setoran;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."batalkan_setoran"(bigint) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.catat_setoran (
  p_nasabah_id uuid,
  p_detail     jsonb
)
  RETURNS public.setoran
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_user_id uuid := (SELECT auth.uid());
    v_role text;
    v_total_berat numeric;
    v_total_harga numeric;
    v_setoran public.setoran;
    v_item record;
    v_count integer;
BEGIN
    IF v_user_id IS NULL OR NOT public.is_petugas() THEN
        RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'Hanya petugas yang dapat mencatat setoran.';
    END IF;

    IF p_nasabah_id IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = 'Nasabah wajib dipilih.';
    END IF;

    IF p_detail IS NULL
       OR jsonb_typeof(p_detail) IS DISTINCT FROM 'array'
       OR jsonb_array_length(p_detail) = 0
       OR jsonb_array_length(p_detail) > 100 THEN
        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = 'Daftar detail sampah tidak valid.';
    END IF;

    -- Kunci profil nasabah.
    SELECT lower(btrim(p.role::text))
    INTO v_role
    FROM public.profiles p
    WHERE p.id = p_nasabah_id
    FOR UPDATE;

    IF v_role IS DISTINCT FROM 'nasabah' THEN
        RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'Profil nasabah tidak ditemukan atau tidak valid.';
    END IF;

    -- Validasi setiap detail.
    FOR v_item IN
        SELECT *
        FROM jsonb_to_recordset(p_detail)
            AS x(jenis_sampah_id bigint, berat numeric)
    LOOP
        IF v_item.jenis_sampah_id IS NULL
           OR v_item.berat IS NULL
           OR v_item.berat <= 0
           OR v_item.berat::text IN ('NaN', 'Infinity', '-Infinity') THEN
            RAISE EXCEPTION USING
                ERRCODE = '22023',
                MESSAGE = 'Jenis sampah dan berat harus valid; berat harus lebih besar dari nol.';
        END IF;
    END LOOP;

    -- Kunci hanya jenis sampah yang masih aktif.
    PERFORM 1
    FROM public.jenis_sampah j
    WHERE j.id IN (
        SELECT DISTINCT x.jenis_sampah_id
        FROM jsonb_to_recordset(p_detail)
            AS x(jenis_sampah_id bigint, berat numeric)
    )
    AND j.is_active IS TRUE
    ORDER BY j.id
    FOR SHARE;

    -- Pastikan semua jenis sampah ditemukan dan aktif.
    SELECT COUNT(DISTINCT x.jenis_sampah_id)
    INTO v_count
    FROM jsonb_to_recordset(p_detail)
        AS x(jenis_sampah_id bigint, berat numeric)
    JOIN public.jenis_sampah j
        ON j.id = x.jenis_sampah_id
       AND j.is_active IS TRUE;

    IF v_count <> (
        SELECT COUNT(DISTINCT x.jenis_sampah_id)
        FROM jsonb_to_recordset(p_detail)
            AS x(jenis_sampah_id bigint, berat numeric)
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = 'Terdapat jenis sampah yang tidak ditemukan atau sudah dinonaktifkan.';
    END IF;

    -- Hitung total menggunakan harga resmi database.
    SELECT
        SUM(x.berat),
        SUM(x.berat * j.harga_per_kg)
    INTO v_total_berat, v_total_harga
    FROM jsonb_to_recordset(p_detail)
        AS x(jenis_sampah_id bigint, berat numeric)
    JOIN public.jenis_sampah j
        ON j.id = x.jenis_sampah_id
       AND j.is_active IS TRUE;

    -- Buat transaksi setoran.
    INSERT INTO public.setoran (
        nasabah_id,
        petugas_id,
        tanggal_setoran,
        total_berat,
        total_harga,
        status
    )
    VALUES (
        p_nasabah_id,
        v_user_id,
        CURRENT_TIMESTAMP,
        v_total_berat,
        v_total_harga,
        'disetujui'
    )
    RETURNING * INTO v_setoran;

    -- Simpan rincian dengan snapshot harga transaksi.
    INSERT INTO public.detail_setoran (
        setoran_id,
        jenis_sampah_id,
        berat,
        harga_per_kg,
        subtotal
    )
    SELECT
        v_setoran.id,
        x.jenis_sampah_id,
        x.berat,
        j.harga_per_kg,
        x.berat * j.harga_per_kg
    FROM jsonb_to_recordset(p_detail)
        AS x(jenis_sampah_id bigint, berat numeric)
    JOIN public.jenis_sampah j
        ON j.id = x.jenis_sampah_id
       AND j.is_active IS TRUE;

    RETURN v_setoran;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."catat_setoran"(uuid, jsonb) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.create_profile_for_new_auth_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$

DECLARE
    v_nama TEXT;

BEGIN

    v_nama := COALESCE(
        NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'nama'), ''),
        NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
        'Pengguna'
    );

    INSERT INTO public.profiles (
        id,
        nama,
        email,
        role
    )
    VALUES (
        NEW.id,
        v_nama,
        NEW.email,
        'nasabah'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;

END;
$function$;

REVOKE ALL ON FUNCTION "public"."create_profile_for_new_auth_user"() FROM PUBLIC, "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.guard_penarikan_balance_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_user_id uuid := (SELECT auth.uid());
BEGIN
    IF TG_OP = 'INSERT' THEN

        IF NEW.status IS DISTINCT FROM 'disetujui'
           OR NEW.status_pembayaran IS DISTINCT FROM 'menunggu'
           OR NEW.nasabah_id IS DISTINCT FROM v_user_id
           OR NEW.petugas_pembayar_id IS NOT NULL
           OR NEW.dibayar_at IS NOT NULL THEN

            RAISE EXCEPTION USING
                ERRCODE = '42501',
                MESSAGE = 'Penarikan harus dibuat melalui fungsi pengajuan yang sah.';
        END IF;

        RETURN NEW;
    END IF;

    -- Identitas dan nominal transaksi tidak boleh berubah
    IF NEW.nasabah_id IS DISTINCT FROM OLD.nasabah_id
       OR NEW.jumlah IS DISTINCT FROM OLD.jumlah
       OR NEW.status IS DISTINCT FROM OLD.status THEN

        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Pemilik, nominal, dan status transaksi tidak dapat diubah.';
    END IF;

    -- Pembayaran yang sudah selesai tidak boleh diubah kembali
    IF OLD.status_pembayaran = 'dibayar' THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Pembayaran yang sudah selesai tidak dapat diubah.';
    END IF;

    -- Perubahan pembayaran hanya boleh dilakukan petugas
    IF NEW.status_pembayaran IS DISTINCT FROM OLD.status_pembayaran THEN

        IF OLD.status_pembayaran IS DISTINCT FROM 'menunggu'
           OR NEW.status_pembayaran IS DISTINCT FROM 'dibayar'
           OR NOT public.is_petugas()
           OR NEW.petugas_pembayar_id IS DISTINCT FROM v_user_id
           OR NEW.dibayar_at IS NULL THEN

            RAISE EXCEPTION USING
                ERRCODE = '42501',
                MESSAGE = 'Hanya petugas yang dapat mengonfirmasi pembayaran.';
        END IF;

        RETURN NEW;
    END IF;

    -- Jika status pembayaran tidak berubah, metadata pembayaran
    -- juga tidak boleh dimanipulasi.
    IF NEW.petugas_pembayar_id IS DISTINCT FROM OLD.petugas_pembayar_id
       OR NEW.dibayar_at IS DISTINCT FROM OLD.dibayar_at THEN

        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Informasi pembayaran tidak dapat diubah secara langsung.';
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."guard_penarikan_balance_change"() FROM PUBLIC, "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.guard_setoran_balance_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_user_id uuid := (SELECT auth.uid());
    v_role text;
BEGIN
    -- INSERT: hanya petugas melalui fungsi pencatatan setoran
    IF TG_OP = 'INSERT' THEN

        IF v_user_id IS NULL
           OR NEW.status IS DISTINCT FROM 'disetujui'
           OR NEW.petugas_id IS DISTINCT FROM v_user_id
           OR NOT public.is_petugas() THEN
            RAISE EXCEPTION USING
                ERRCODE = '42501',
                MESSAGE = 'Setoran harus dicatat melalui petugas yang berwenang.';
        END IF;

        SELECT lower(btrim(p.role::text))
        INTO v_role
        FROM public.profiles p
        WHERE p.id = NEW.nasabah_id;

        IF v_role IS DISTINCT FROM 'nasabah' THEN
            RAISE EXCEPTION USING
                ERRCODE = '42501',
                MESSAGE = 'Nasabah tidak valid.';
        END IF;

        RETURN NEW;
    END IF;

    -- UPDATE: hanya admin melalui RPC khusus
    IF v_user_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'Hanya admin yang dapat mengoreksi setoran.';
    END IF;

    -- Setoran yang sudah dibatalkan tidak boleh diubah lagi
    IF OLD.status = 'dibatalkan' THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Setoran yang sudah dibatalkan tidak dapat diubah.';
    END IF;

    -- Pemilik dan petugas pencatat tetap
    IF NEW.nasabah_id IS DISTINCT FROM OLD.nasabah_id
       OR NEW.petugas_id IS DISTINCT FROM OLD.petugas_id THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Pemilik dan petugas pencatat tidak dapat diubah.';
    END IF;

    -- Kunci profil nasabah
    PERFORM 1
    FROM public.profiles p
    WHERE p.id = OLD.nasabah_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = 'Profil nasabah tidak ditemukan.';
    END IF;

    -- Validasi perubahan status
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (
           (OLD.status = 'menunggu'
            AND NEW.status IN ('disetujui', 'ditolak', 'dibatalkan'))
           OR
           (OLD.status = 'disetujui'
            AND NEW.status = 'dibatalkan')
       ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Transisi status setoran tidak valid.';
    END IF;

    -- Validasi nilai transaksi
    IF NEW.total_berat IS NULL
       OR NEW.total_berat <= 0
       OR NEW.total_harga IS NULL
       OR NEW.total_harga < 0 THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Nilai total setoran tidak valid.';
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."guard_setoran_balance_change"() FROM PUBLIC, "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$

    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'admin'
    );

$function$;

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.is_petugas()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'petugas'
    );
$function$;

REVOKE ALL ON FUNCTION "public"."is_petugas"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.koreksi_setoran (
  p_setoran_id bigint,
  p_detail     jsonb
)
  RETURNS public.setoran
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_user_id uuid := (SELECT auth.uid());
    v_setoran public.setoran;
    v_item jsonb;
    v_resolved jsonb := '[]'::jsonb;
    v_detail_id bigint;
    v_jenis_id bigint;
    v_berat numeric;
    v_harga_input numeric;
    v_harga numeric;
    v_harga_historis numeric;
    v_jenis_lama bigint;
    v_total_berat numeric := 0;
    v_total_harga numeric := 0;
    v_total_setoran numeric := 0;
    v_total_penarikan numeric := 0;
    v_saldo_setelah numeric := 0;
    v_old_detail jsonb;
    v_used_ids bigint[] := ARRAY[]::bigint[];
    v_is_active boolean;
BEGIN
    -- 1. Pemeriksaan hak akses
    IF v_user_id IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Hanya admin yang dapat mengoreksi setoran.';
    END IF;

    IF p_setoran_id IS NULL OR p_detail IS NULL
       OR jsonb_typeof(p_detail) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Parameter koreksi tidak valid.';
    END IF;

    IF jsonb_array_length(p_detail) < 1
       OR jsonb_array_length(p_detail) > 100 THEN
        RAISE EXCEPTION 'Detail setoran harus berisi 1 sampai 100 item.';
    END IF;

    -- 2. Kunci transaksi setoran
    SELECT s.*
    INTO v_setoran
    FROM public.setoran s
    WHERE s.id = p_setoran_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Setoran tidak ditemukan.';
    END IF;

    IF v_setoran.status NOT IN ('disetujui', 'menunggu') THEN
        RAISE EXCEPTION 'Setoran dengan status ini tidak dapat dikoreksi.';
    END IF;

    -- 3. Ambil detail lama untuk audit
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'jenis_sampah_id', d.jenis_sampah_id,
                'berat', d.berat,
                'harga_per_kg', d.harga_per_kg,
                'subtotal', d.subtotal
            )
        ),
        '[]'::jsonb
    )
    INTO v_old_detail
    FROM public.detail_setoran d
    WHERE d.setoran_id = p_setoran_id;

    -- 4. Kunci profil nasabah
    PERFORM 1
    FROM public.profiles p
    WHERE p.id = v_setoran.nasabah_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profil nasabah tidak ditemukan.';
    END IF;

    -- 5. Validasi dan hitung detail baru
    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_detail)
    LOOP
        v_detail_id := NULLIF(v_item->>'detail_id', '')::bigint;
        v_jenis_id := (v_item->>'jenis_sampah_id')::bigint;
        v_berat := (v_item->>'berat')::numeric;
        v_harga_input := NULLIF(
            v_item->>'harga_per_kg', ''
        )::numeric;

        IF v_jenis_id IS NULL
           OR v_berat IS NULL
           OR v_berat <= 0
           OR v_berat::text IN ('NaN', 'Infinity', '-Infinity')
           OR v_harga_input < 0
           OR v_harga_input::text IN ('NaN', 'Infinity', '-Infinity') THEN
            RAISE EXCEPTION 'Berat, jenis sampah, atau harga tidak valid.';
        END IF;

        -- Detail lama: periksa apakah jenisnya tetap sama.
        IF v_detail_id IS NOT NULL THEN

            IF v_detail_id = ANY(v_used_ids) THEN
                RAISE EXCEPTION 'Detail setoran tidak boleh digunakan dua kali.';
            END IF;

            SELECT d.harga_per_kg, d.jenis_sampah_id
            INTO v_harga_historis, v_jenis_lama
            FROM public.detail_setoran d
            WHERE d.id = v_detail_id
              AND d.setoran_id = p_setoran_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Detail setoran tidak valid.';
            END IF;

            v_used_ids := array_append(v_used_ids, v_detail_id);

            -- Jika jenis berubah, jenis pengganti harus aktif.
            IF v_jenis_id IS DISTINCT FROM v_jenis_lama THEN
                SELECT j.is_active
                INTO v_is_active
                FROM public.jenis_sampah j
                WHERE j.id = v_jenis_id
                FOR SHARE;

                IF NOT FOUND OR v_is_active IS NOT TRUE THEN
                    RAISE EXCEPTION
                        'Jenis sampah pengganti harus tersedia dan aktif.';
                END IF;
            ELSE
                -- Jenis lama boleh tetap digunakan meskipun nonaktif.
                PERFORM 1
                FROM public.jenis_sampah j
                WHERE j.id = v_jenis_id
                FOR SHARE;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Jenis sampah ID % tidak ditemukan.', v_jenis_id;
                END IF;
            END IF;

            -- Harga historis dipertahankan jika tidak diubah.
            v_harga := COALESCE(
                v_harga_input,
                v_harga_historis
            );

        ELSE
            -- Detail baru wajib memakai jenis sampah aktif.
            SELECT j.harga_per_kg, j.is_active
            INTO v_harga_historis, v_is_active
            FROM public.jenis_sampah j
            WHERE j.id = v_jenis_id
            FOR SHARE;

            IF NOT FOUND OR v_is_active IS NOT TRUE THEN
                RAISE EXCEPTION
                    'Detail baru harus menggunakan jenis sampah yang aktif.';
            END IF;

            -- Gunakan harga input admin atau harga resmi saat ini.
            v_harga := COALESCE(
                v_harga_input,
                v_harga_historis
            );
        END IF;

        IF v_harga IS NULL
           OR v_harga < 0
           OR v_harga::text IN ('NaN', 'Infinity', '-Infinity') THEN
            RAISE EXCEPTION 'Harga per kg tidak valid.';
        END IF;

        v_total_berat := v_total_berat + v_berat;
        v_total_harga := v_total_harga + (v_berat * v_harga);

        v_resolved := v_resolved || jsonb_build_array(
            jsonb_build_object(
                'jenis_sampah_id', v_jenis_id,
                'berat', v_berat,
                'harga_per_kg', v_harga,
                'subtotal', v_berat * v_harga
            )
        );
    END LOOP;

    -- 6. Pastikan saldo nasabah tidak negatif
    IF v_setoran.status = 'disetujui' THEN

        SELECT COALESCE(SUM(s.total_harga), 0)
        INTO v_total_setoran
        FROM public.setoran s
        WHERE s.nasabah_id = v_setoran.nasabah_id
          AND s.status = 'disetujui';

        SELECT COALESCE(SUM(p.jumlah), 0)
        INTO v_total_penarikan
        FROM public.penarikan p
        WHERE p.nasabah_id = v_setoran.nasabah_id
          AND p.status IN ('menunggu', 'disetujui');

        v_saldo_setelah :=
            v_total_setoran
            - v_total_penarikan
            - COALESCE(v_setoran.total_harga, 0)
            + v_total_harga;

        IF v_saldo_setelah < 0 THEN
            RAISE EXCEPTION
                'Koreksi ditolak. Saldo nasabah akan menjadi negatif. Saldo setelah koreksi: %',
                v_saldo_setelah;
        END IF;
    END IF;

    -- 7. Ganti seluruh detail transaksi
    DELETE FROM public.detail_setoran
    WHERE setoran_id = p_setoran_id;

    INSERT INTO public.detail_setoran (
        setoran_id,
        jenis_sampah_id,
        berat,
        harga_per_kg,
        subtotal
    )
    SELECT
        p_setoran_id,
        (item->>'jenis_sampah_id')::bigint,
        (item->>'berat')::numeric,
        (item->>'harga_per_kg')::numeric,
        (item->>'subtotal')::numeric
    FROM jsonb_array_elements(v_resolved) AS item;

    -- 8. Perbarui total setoran
    UPDATE public.setoran
    SET total_berat = v_total_berat,
        total_harga = v_total_harga
    WHERE id = p_setoran_id
    RETURNING * INTO v_setoran;

    -- 9. Catat audit
    INSERT INTO public.audit_log (user_id, aktivitas)
    VALUES (
        v_user_id,
        format(
            'Koreksi setoran #%s. Detail lama: %s. Detail baru: %s. Total baru: %s.',
            p_setoran_id,
            v_old_detail::text,
            v_resolved::text,
            v_total_harga
        )
    );

    RETURN v_setoran;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."koreksi_setoran"(bigint, jsonb) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.prevent_self_admin_role()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$

DECLARE
    v_request_role TEXT := auth.role();
    v_user_id UUID := auth.uid();
    v_new_role TEXT := NEW.role::TEXT;

BEGIN

    IF TG_OP = 'UPDATE'
       AND NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'ID profil tidak dapat diubah.';
    END IF;

    -- Pengecualian untuk trigger internal Supabase Auth.
    IF TG_OP = 'INSERT'
       AND session_user = 'supabase_auth_admin'
       AND pg_trigger_depth() > 1
       AND v_new_role = 'nasabah'
       AND EXISTS (
           SELECT 1
           FROM auth.users u
           WHERE u.id = NEW.id
       ) THEN
        RETURN NEW;
    END IF;

    -- Operasi administratif SQL Editor.
    IF v_request_role IS NULL
       AND session_user IN ('postgres', 'supabase_admin') THEN
        RETURN NEW;
    END IF;

    IF v_new_role IS NULL
       OR v_new_role NOT IN ('admin', 'petugas', 'nasabah') THEN
        RAISE EXCEPTION 'Role tidak valid.';
    END IF;

    IF TG_OP = 'INSERT' THEN

        IF v_request_role IS DISTINCT FROM 'authenticated'
           OR v_user_id IS NULL
           OR NEW.id IS DISTINCT FROM v_user_id
           OR v_new_role <> 'nasabah' THEN
            RAISE EXCEPTION
                'Registrasi hanya dapat membuat profil nasabah sendiri.';
        END IF;

        RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN

        IF v_request_role IS DISTINCT FROM 'authenticated'
           OR v_user_id IS NULL
           OR NEW.id IS NOT DISTINCT FROM v_user_id
           OR NOT COALESCE(public.is_admin(), FALSE) THEN
            RAISE EXCEPTION
                'Hanya admin yang dapat mengubah role pengguna lain.';
        END IF;

    END IF;

    RETURN NEW;

END;
$function$;

REVOKE ALL ON FUNCTION "public"."prevent_self_admin_role"() FROM PUBLIC, "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.tambah_jenis_sampah (
  p_nama_sampah  text,
  p_harga_per_kg numeric,
  p_satuan       text    DEFAULT 'kg'::text
)
  RETURNS public.jenis_sampah
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_result public.jenis_sampah;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Hanya admin yang dapat menambahkan jenis sampah.';
    END IF;

    IF p_nama_sampah IS NULL OR btrim(p_nama_sampah) = ''
       OR p_harga_per_kg IS NULL
       OR p_harga_per_kg < 0
       OR p_harga_per_kg::text IN ('NaN', 'Infinity', '-Infinity')
       OR p_satuan IS NULL OR btrim(p_satuan) = '' THEN
        RAISE EXCEPTION 'Data jenis sampah tidak valid.';
    END IF;

    INSERT INTO public.jenis_sampah (
        nama_sampah, harga_per_kg, satuan, is_active
    )
    VALUES (
        btrim(p_nama_sampah), p_harga_per_kg, btrim(p_satuan), true
    )
    RETURNING * INTO v_result;

    INSERT INTO public.audit_log (user_id, aktivitas)
    VALUES (
        auth.uid(),
        'Menambahkan jenis sampah: ' || v_result.nama_sampah
    );

    RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."tambah_jenis_sampah"(text, numeric, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.tandai_penarikan_dibayar (
  p_penarikan_id bigint
)
  RETURNS public.penarikan
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_user_id uuid := (SELECT auth.uid());
    v_penarikan public.penarikan;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '28000',
            MESSAGE = 'Sesi autentikasi diperlukan.';
    END IF;

    IF NOT public.is_petugas() THEN
        RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'Hanya petugas yang dapat mengonfirmasi pembayaran.';
    END IF;

    IF p_penarikan_id IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = 'ID penarikan tidak valid.';
    END IF;

    SELECT *
    INTO v_penarikan
    FROM public.penarikan
    WHERE id = p_penarikan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0002',
            MESSAGE = 'Transaksi penarikan tidak ditemukan.';
    END IF;

    IF v_penarikan.status IS DISTINCT FROM 'disetujui' THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Transaksi penarikan belum disetujui.';
    END IF;

    IF v_penarikan.status_pembayaran IS DISTINCT FROM 'menunggu' THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Pembayaran sudah pernah dikonfirmasi.';
    END IF;

    UPDATE public.penarikan
    SET
        status_pembayaran = 'dibayar',
        petugas_pembayar_id = v_user_id,
        dibayar_at = CURRENT_TIMESTAMP
    WHERE id = p_penarikan_id
    RETURNING * INTO v_penarikan;

    RETURN v_penarikan;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."tandai_penarikan_dibayar"(bigint) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.ubah_jenis_sampah (
  p_id           bigint,
  p_nama_sampah  text,
  p_harga_per_kg numeric,
  p_satuan       text
)
  RETURNS public.jenis_sampah
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_result public.jenis_sampah;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Hanya admin yang dapat mengubah jenis sampah.';
    END IF;

    IF p_id IS NULL
       OR p_nama_sampah IS NULL OR btrim(p_nama_sampah) = ''
       OR p_harga_per_kg IS NULL
       OR p_harga_per_kg < 0
       OR p_harga_per_kg::text IN ('NaN', 'Infinity', '-Infinity')
       OR p_satuan IS NULL OR btrim(p_satuan) = '' THEN
        RAISE EXCEPTION 'Data jenis sampah tidak valid.';
    END IF;

    UPDATE public.jenis_sampah
    SET nama_sampah = btrim(p_nama_sampah),
        harga_per_kg = p_harga_per_kg,
        satuan = btrim(p_satuan)
    WHERE id = p_id
    RETURNING * INTO v_result;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jenis sampah tidak ditemukan.';
    END IF;

    INSERT INTO public.audit_log (user_id, aktivitas)
    VALUES (
        auth.uid(),
        'Mengubah jenis sampah ID ' || p_id::text ||
        ': ' || v_result.nama_sampah
    );

    RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."ubah_jenis_sampah"(bigint, text, numeric, text) FROM PUBLIC, "anon";

ALTER TABLE "public"."detail_setoran"
  ADD CONSTRAINT "detail_setoran_jenis_sampah_id_fkey" FOREIGN KEY (jenis_sampah_id) REFERENCES public.jenis_sampah(id);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."audit_log"
  ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."penarikan"
  ADD CONSTRAINT "penarikan_nasabah_id_fkey" FOREIGN KEY (nasabah_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."penarikan"
  ADD CONSTRAINT "penarikan_petugas_pembayar_fkey" FOREIGN KEY (petugas_pembayar_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."setoran"
  ADD CONSTRAINT "setoran_nasabah_id_fkey" FOREIGN KEY (nasabah_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."setoran"
  ADD CONSTRAINT "setoran_petugas_id_fkey" FOREIGN KEY (petugas_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."detail_setoran"
  ADD CONSTRAINT "detail_setoran_setoran_id_fkey" FOREIGN KEY (setoran_id) REFERENCES public.setoran(id) ON DELETE CASCADE;

CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_new_auth_user();

CREATE TRIGGER trg_guard_penarikan_balance_change
  BEFORE INSERT OR UPDATE ON public.penarikan
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_penarikan_balance_change();

CREATE TRIGGER trg_prevent_self_admin_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_admin_role();

CREATE TRIGGER trg_guard_setoran_balance_change
  BEFORE INSERT OR UPDATE ON public.setoran
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_setoran_balance_change();

CREATE POLICY "audit_log_select" ON "public"."audit_log"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "detail_setoran_insert" ON "public"."detail_setoran"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (false);

CREATE POLICY "detail_setoran_select" ON "public"."detail_setoran"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.setoran s
  WHERE
    ((s.id = detail_setoran.setoran_id) AND (public.is_admin() OR (public.is_petugas() AND (s.petugas_id = ( SELECT auth.uid() AS uid))) OR (s.nasabah_id = ( SELECT auth.uid() AS
    uid)))))));

CREATE POLICY "jenis_sampah_delete" ON "public"."jenis_sampah"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "jenis_sampah_insert" ON "public"."jenis_sampah"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "jenis_sampah_select" ON "public"."jenis_sampah"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "jenis_sampah_update" ON "public"."jenis_sampah"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "penarikan_insert" ON "public"."penarikan"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (false);

CREATE POLICY "penarikan_select" ON "public"."penarikan"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_admin() OR (nasabah_id = ( SELECT auth.uid() AS uid)) OR (public.is_petugas() AND ((status_pembayaran)::text = 'menunggu'::text))));

CREATE POLICY "profiles_insert" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((id = ( SELECT auth.uid() AS uid)) AND ((role)::text = 'nasabah'::text)));

CREATE POLICY "profiles_select" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_admin() OR (id = ( SELECT auth.uid() AS uid)) OR (public.is_petugas() AND ((ROLE)::text = 'nasabah'::text))));

CREATE POLICY "profiles_update" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_admin() OR (id = ( SELECT auth.uid() AS uid))))
  WITH CHECK ((public.is_admin() OR (id = ( SELECT auth.uid() AS uid))));

CREATE POLICY "setoran_insert" ON "public"."setoran"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (false);

CREATE POLICY "setoran_select" ON "public"."setoran"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_admin() OR (public.is_petugas() AND (petugas_id = ( SELECT auth.uid() AS uid))) OR (nasabah_id = ( SELECT auth.uid() AS uid))));

COMMENT ON COLUMN "public"."profiles"."saldo" IS 'Saldo aktif nasabah dalam Rupiah';

GRANT EXECUTE ON FUNCTION "public"."ajukan_penarikan"(numeric) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."ajukan_penarikan"(numeric) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."ajukan_penarikan"(numeric) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."atur_status_jenis_sampah"(bigint, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."atur_status_jenis_sampah"(bigint, boolean) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."atur_status_jenis_sampah"(bigint, boolean) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."atur_status_jenis_sampah"(bigint, boolean) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."batalkan_setoran"(bigint) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."batalkan_setoran"(bigint) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."batalkan_setoran"(bigint) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."batalkan_setoran"(bigint) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."catat_setoran"(uuid, jsonb) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."catat_setoran"(uuid, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."catat_setoran"(uuid, jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."catat_setoran"(uuid, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."create_profile_for_new_auth_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_profile_for_new_auth_user"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."guard_penarikan_balance_change"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."guard_penarikan_balance_change"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."guard_setoran_balance_change"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."guard_setoran_balance_change"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_petugas"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."is_petugas"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_petugas"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_petugas"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."koreksi_setoran"(bigint, jsonb) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."koreksi_setoran"(bigint, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."koreksi_setoran"(bigint, jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."koreksi_setoran"(bigint, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."prevent_self_admin_role"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."prevent_self_admin_role"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."tambah_jenis_sampah"(text, numeric, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."tambah_jenis_sampah"(text, numeric, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."tambah_jenis_sampah"(text, numeric, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."tambah_jenis_sampah"(text, numeric, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."tandai_penarikan_dibayar"(bigint) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."tandai_penarikan_dibayar"(bigint) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."tandai_penarikan_dibayar"(bigint) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."tandai_penarikan_dibayar"(bigint) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."ubah_jenis_sampah"(bigint, text, numeric, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."ubah_jenis_sampah"(bigint, text, numeric, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."ubah_jenis_sampah"(bigint, text, numeric, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."ubah_jenis_sampah"(bigint, text, numeric, text) TO "service_role";

REVOKE ALL ON SEQUENCE "public"."audit_log_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."audit_log_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."audit_log_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."audit_log_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."audit_log_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."audit_log_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."audit_log_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."detail_setoran_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."detail_setoran_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."detail_setoran_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."detail_setoran_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."detail_setoran_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."detail_setoran_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."detail_setoran_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."detail_setoran_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."jenis_sampah_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."jenis_sampah_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."jenis_sampah_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."jenis_sampah_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."jenis_sampah_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."jenis_sampah_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."jenis_sampah_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."jenis_sampah_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."penarikan_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."penarikan_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."penarikan_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."penarikan_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."penarikan_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."penarikan_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."penarikan_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."penarikan_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."setoran_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."setoran_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."setoran_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."setoran_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."setoran_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."setoran_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."setoran_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."setoran_id_seq" TO "service_role";

REVOKE ALL ON TABLE "public"."audit_log" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."audit_log" TO "anon";

REVOKE ALL ON TABLE "public"."audit_log" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."audit_log" TO "authenticated";

REVOKE ALL ON TABLE "public"."audit_log" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_log" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_log" TO "service_role";

REVOKE ALL ON TABLE "public"."detail_setoran" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."detail_setoran" TO "anon";

REVOKE ALL ON TABLE "public"."detail_setoran" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."detail_setoran" TO "authenticated";

REVOKE ALL ON TABLE "public"."detail_setoran" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."detail_setoran" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."detail_setoran" TO "service_role";

REVOKE ALL ON TABLE "public"."jenis_sampah" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."jenis_sampah" TO "anon";

REVOKE ALL ON TABLE "public"."jenis_sampah" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."jenis_sampah" TO "authenticated";

REVOKE ALL ON TABLE "public"."jenis_sampah" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."jenis_sampah" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."jenis_sampah" TO "service_role";

REVOKE ALL ON TABLE "public"."penarikan" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."penarikan" TO "anon";

REVOKE ALL ON TABLE "public"."penarikan" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."penarikan" TO "authenticated";

REVOKE ALL ON TABLE "public"."penarikan" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."penarikan" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."penarikan" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."profiles" TO "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."setoran" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."setoran" TO "anon";

REVOKE ALL ON TABLE "public"."setoran" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, UPDATE ON TABLE "public"."setoran" TO "authenticated";

REVOKE ALL ON TABLE "public"."setoran" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."setoran" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."setoran" TO "service_role";

