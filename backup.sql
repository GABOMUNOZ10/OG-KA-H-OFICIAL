--
-- PostgreSQL database dump
--

\restrict KCmuxeMO5JX4tt9YeSJtU8t2viIwqzsNAfVIKe3Zq5dhf3WrFTrSBYLdOjsNyqG

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: presupuestos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presupuestos (
    id_ahorro integer CONSTRAINT ahorros_id_ahorro_not_null NOT NULL,
    id_usuario integer CONSTRAINT ahorros_id_usuario_not_null NOT NULL,
    monto_objetivo numeric(12,2),
    monto_actual numeric(12,2),
    descripcion text,
    bloqueado boolean DEFAULT false,
    categoria character varying(100),
    periodo_inicio date,
    periodo_fin date
);


ALTER TABLE public.presupuestos OWNER TO postgres;

--
-- Name: ahorros_id_ahorro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ahorros_id_ahorro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ahorros_id_ahorro_seq OWNER TO postgres;

--
-- Name: ahorros_id_ahorro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ahorros_id_ahorro_seq OWNED BY public.presupuestos.id_ahorro;


--
-- Name: alertas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alertas (
    id_alerta integer NOT NULL,
    id_usuario integer NOT NULL,
    tipo_alerta character varying(100),
    mensaje text,
    fecha_alerta timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.alertas OWNER TO postgres;

--
-- Name: alertas_id_alerta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alertas_id_alerta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alertas_id_alerta_seq OWNER TO postgres;

--
-- Name: alertas_id_alerta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alertas_id_alerta_seq OWNED BY public.alertas.id_alerta;


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id_categoria integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(20) NOT NULL,
    CONSTRAINT categorias_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ingreso'::character varying, 'gasto'::character varying])::text[])))
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- Name: categorias_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_categoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_categoria_seq OWNER TO postgres;

--
-- Name: categorias_id_categoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_categoria_seq OWNED BY public.categorias.id_categoria;


--
-- Name: gastos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gastos (
    id_gasto integer NOT NULL,
    id_usuario integer NOT NULL,
    id_categoria integer,
    monto numeric(12,2) NOT NULL,
    descripcion text,
    metodo_pago character varying(50),
    fecha_gasto date NOT NULL,
    categoria character varying(100)
);


ALTER TABLE public.gastos OWNER TO postgres;

--
-- Name: gastos_id_gasto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gastos_id_gasto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gastos_id_gasto_seq OWNER TO postgres;

--
-- Name: gastos_id_gasto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gastos_id_gasto_seq OWNED BY public.gastos.id_gasto;


--
-- Name: ingresos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingresos (
    id_ingreso integer NOT NULL,
    id_usuario integer NOT NULL,
    id_categoria integer,
    monto numeric(12,2) NOT NULL,
    descripcion text,
    metodo_pago character varying(50),
    fecha_ingreso date NOT NULL,
    categoria character varying(100)
);


ALTER TABLE public.ingresos OWNER TO postgres;

--
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingresos_id_ingreso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingresos_id_ingreso_seq OWNER TO postgres;

--
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingresos_id_ingreso_seq OWNED BY public.ingresos.id_ingreso;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    contrasena character varying(255) NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- Name: alertas id_alerta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas ALTER COLUMN id_alerta SET DEFAULT nextval('public.alertas_id_alerta_seq'::regclass);


--
-- Name: categorias id_categoria; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id_categoria SET DEFAULT nextval('public.categorias_id_categoria_seq'::regclass);


--
-- Name: gastos id_gasto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos ALTER COLUMN id_gasto SET DEFAULT nextval('public.gastos_id_gasto_seq'::regclass);


--
-- Name: ingresos id_ingreso; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos ALTER COLUMN id_ingreso SET DEFAULT nextval('public.ingresos_id_ingreso_seq'::regclass);


--
-- Name: presupuestos id_ahorro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuestos ALTER COLUMN id_ahorro SET DEFAULT nextval('public.ahorros_id_ahorro_seq'::regclass);


--
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- Data for Name: alertas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alertas (id_alerta, id_usuario, tipo_alerta, mensaje, fecha_alerta) FROM stdin;
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id_categoria, nombre, tipo) FROM stdin;
1	Salario	ingreso
2	Freelance	ingreso
3	Negocio	ingreso
4	Inversiones	ingreso
5	Ventas	ingreso
6	Bonos	ingreso
7	Regalos	ingreso
8	Alquiler	ingreso
9	Intereses	ingreso
10	Otros Ingresos	ingreso
11	Alimentación	gasto
12	Transporte	gasto
13	Vivienda	gasto
14	Servicios	gasto
15	Salud	gasto
16	Educación	gasto
17	Entretenimiento	gasto
18	Ropa	gasto
19	Tecnología	gasto
20	Mascotas	gasto
21	Gimnasio	gasto
22	Restaurantes	gasto
23	Viajes	gasto
24	Regalos	gasto
25	Seguros	gasto
26	Impuestos	gasto
27	Otros Gastos	gasto
\.


--
-- Data for Name: gastos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gastos (id_gasto, id_usuario, id_categoria, monto, descripcion, metodo_pago, fecha_gasto, categoria) FROM stdin;
1	1	\N	50000.00	Comida	Efectivo	2025-10-07	\N
2	1	\N	80000.00	Transporte	Tarjeta	2025-10-08	\N
3	16	\N	12.00	1	Efectivo	2025-10-17	Alimentación
4	16	\N	2.00	pobres	Efectivo	2025-10-17	Educación
5	16	\N	15.00	1	Efectivo	2025-10-17	Alimentación
6	16	\N	60.00	1	Efectivo	2025-10-17	Alimentación
7	16	\N	80.00	1	Transferencia	2025-10-17	Alimentación
8	16	\N	800.00	2	Efectivo	2025-10-17	Alimentación
9	25	\N	50.00	hamburguesa	Transferencia	2025-10-17	Alimentación
10	14	\N	100000.00	comida	Efectivo	2025-10-17	Entretenimiento
11	26	\N	15.00	pizza	Transferencia	2025-10-16	Alimentación
12	26	\N	500.00	hijos	Efectivo	2025-10-18	Educación
\.


--
-- Data for Name: ingresos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingresos (id_ingreso, id_usuario, id_categoria, monto, descripcion, metodo_pago, fecha_ingreso, categoria) FROM stdin;
1	1	\N	1200000.00	Pago mensual	Transferencia	2025-10-07	\N
2	1	\N	200000.00	Venta freelance	Efectivo	2025-10-08	\N
5	16	\N	100.00	nada	Efectivo	2025-10-17	Alquiler
7	25	\N	25.00	casa	Efectivo	2025-10-16	Alquiler
8	20	\N	10000.00	ahorro	Efectivo	2025-10-15	Alquiler
9	16	\N	100000.00	222	Efectivo	2025-10-17	Alquiler
10	14	\N	120000.00	arriendo	Efectivo	2025-10-17	Alquiler
11	26	\N	12.00	casa	Efectivo	2025-10-03	Alquiler
12	26	\N	800.00	apuestas	Efectivo	2025-10-18	Inversiones
\.


--
-- Data for Name: presupuestos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.presupuestos (id_ahorro, id_usuario, monto_objetivo, monto_actual, descripcion, bloqueado, categoria, periodo_inicio, periodo_fin) FROM stdin;
5	16	15.00	0.00	Presupuesto Alimentación	f	Alimentación	2025-10-17	2025-10-18
6	16	50.00	0.00	Presupuesto Alimentación	f	Alimentación	2025-10-17	2025-10-18
7	16	500000.00	0.00	Presupuesto Alimentación	f	Alimentación	2025-10-17	2025-11-16
8	22	150000.00	0.00	Presupuesto Alimentación	f	Alimentación	2025-10-17	2025-11-16
10	26	500.00	0.00	Presupuesto Educación	f	Educación	2025-10-18	2025-11-17
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre, correo, contrasena, fecha_registro) FROM stdin;
1	Felipe Jaramillo	felipe@ogkash.com	12345	2025-10-07 16:43:19.23372
8	gabo	gabo@ogkash.com	123456789	2025-10-16 16:45:45.919701
10	gabor	gabor@ogkash.com	gabo123	2025-10-16 16:46:47.319801
12	gabore	gabore@ogkash.com	123456	2025-10-16 16:47:18.73225
14	santiago	santiago@ogkash.com	123456	2025-10-16 16:58:17.236736
16	sofia	sofia@ogkash.com	1234	2025-10-16 17:00:41.654887
19	rafael	rafael@ogkash.com	1234	2025-10-16 17:08:59.196946
20	rafael12	rafael12@ogkash.com	1234	2025-10-16 19:48:46.084329
21	2	2@ogkash.com	1	2025-10-16 19:52:19.044821
22	santiago23	santiago23@ogkash.com	1234	2025-10-16 21:41:09.700906
23	karolg	karolg@ogkash.com	123	2025-10-16 22:31:17.755718
25	jenny	jenny@ogkash.com	1234	2025-10-16 22:38:51.705085
26	mateo	mateo@ogkash.com	1234	2025-10-18 10:32:14.838702
\.


--
-- Name: ahorros_id_ahorro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ahorros_id_ahorro_seq', 10, true);


--
-- Name: alertas_id_alerta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alertas_id_alerta_seq', 1, false);


--
-- Name: categorias_id_categoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_categoria_seq', 27, true);


--
-- Name: gastos_id_gasto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gastos_id_gasto_seq', 12, true);


--
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingresos_id_ingreso_seq', 12, true);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 26, true);


--
-- Name: presupuestos ahorros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT ahorros_pkey PRIMARY KEY (id_ahorro);


--
-- Name: alertas alertas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas
    ADD CONSTRAINT alertas_pkey PRIMARY KEY (id_alerta);


--
-- Name: categorias categorias_nombre_tipo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_tipo_key UNIQUE (nombre, tipo);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id_categoria);


--
-- Name: gastos gastos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_pkey PRIMARY KEY (id_gasto);


--
-- Name: ingresos ingresos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_pkey PRIMARY KEY (id_ingreso);


--
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: presupuestos ahorros_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT ahorros_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;


--
-- Name: alertas alertas_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas
    ADD CONSTRAINT alertas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;


--
-- Name: gastos gastos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;


--
-- Name: ingresos ingresos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KCmuxeMO5JX4tt9YeSJtU8t2viIwqzsNAfVIKe3Zq5dhf3WrFTrSBYLdOjsNyqG

