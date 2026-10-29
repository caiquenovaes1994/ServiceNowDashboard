#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de Relatório PDF de Alta Fidelidade: Folha de Hora Extra
Desenvolvido com ReportLab para espelhar fielmente a planilha oficial (Folha_de_Apontamentos_19022025.xlsx).
Dimensões exatas em A4 Paisagem (Landscape) com proporcionalidade milimétrica das colunas e linhas:
- DIA: 183px
- SEMANA: 183px
- DATA: 183px
- INÍCIO: 150px
- INTERVALO: 150px
- VOLTA: 150px
- TÉRMINO: 150px
- HORAS TRABALHADAS: 188px
- HORAS A RECEBER: 300px (150px para 50% e 150px para 100%)
- OBSERVAÇÕES: 336px
Total: 2093px escalado perfeitamente para 27.7 cm de largura útil em A4.
"""

import sys
import os
import json
import argparse
from datetime import datetime, date, timedelta

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

import dateutil.easter
import holidays

# Registro da fonte Calibri nativa do Windows (com fallback seguro para Helvetica)
_font_dir = r"C:\Windows\Fonts"
_calibri_reg = os.path.join(_font_dir, "calibri.ttf")
_calibri_bold = os.path.join(_font_dir, "calibrib.ttf")

if os.path.exists(_calibri_reg) and os.path.exists(_calibri_bold):
    try:
        pdfmetrics.registerFont(TTFont("Calibri", _calibri_reg))
        pdfmetrics.registerFont(TTFont("Calibri-Bold", _calibri_bold))
        DEFAULT_FONT = "Calibri"
        DEFAULT_FONT_BOLD = "Calibri-Bold"
    except Exception:
        DEFAULT_FONT = "Helvetica"
        DEFAULT_FONT_BOLD = "Helvetica-Bold"
else:
    DEFAULT_FONT = "Helvetica"
    DEFAULT_FONT_BOLD = "Helvetica-Bold"

# Tamanhos de fonte especificados pelo usuário:
# "FOLHA DE HORA EXTRA": 14px | Todo o restante: 11px (1px = 0.75pt em ReportLab)
FS_TITLE = 14 * 0.75   # 10.5 pt
FS_MAIN  = 11 * 0.75   # 8.25 pt

# Cores oficiais fornecidas pelo usuário
HEADER_BG = colors.HexColor("#632523")        # background Cabeçalho: #632523
COL_HEADER_BG = colors.HexColor("#C0504D")    # background Dia, semana... : #c0504d
GRAY_WEEKEND = colors.HexColor("#D9D9D9")     # background fins de semana e feriados: #d9d9d9
GRAY_NAME_BG = colors.HexColor("#D9D9D9")     # background nome do colaborador, mês e ano: #d9d9d9
TEXT_HEADER = colors.HexColor("#FFFFFF")      # Títulos cabeçalhos: #ffffff
TEXT_MAIN = colors.HexColor("#000000")        # Nome do colaborador, Mês referente, Ano e texto na tabela: #000000
WHITE = colors.white
BLACK = colors.black

_feriados_cache = {}

def get_feriados(ano: int):
    """Retorna feriados nacionais + estaduais SP + municipais São Paulo/SP."""
    if ano in _feriados_cache:
        return _feriados_cache[ano]

    f = holidays.country_holidays("BR", subdiv="SP", years=ano)

    municipais = {
        date(ano, 1, 25): "Aniversário de São Paulo",
        date(ano, 7, 9):  "Revolução Constitucionalista",
        date(ano, 11, 20): "Dia da Consciência Negra",
    }

    try:
        pascoa = dateutil.easter.easter(ano)
        carnaval = pascoa - timedelta(days=47)
        sexta_santa = pascoa - timedelta(days=2)
        corpus_christi = pascoa + timedelta(days=60)
        municipais[carnaval] = "Carnaval"
        municipais[sexta_santa] = "Sexta-feira Santa"
        municipais[corpus_christi] = "Corpus Christi"
    except Exception as e:
        sys.stderr.write(f"Aviso feriados móveis {ano}: {e}\n")

    for d, name in municipais.items():
        f[d] = name

    _feriados_cache[ano] = f
    return f

def get_dia_semana(data_obj) -> str:
    dias = ["SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO", "DOMINGO"]
    data_date = data_obj.date() if isinstance(data_obj, datetime) else data_obj
    feriados = get_feriados(data_date.year)
    if data_date in feriados:
        return "FERIADO"
    return dias[data_date.weekday()]

def format_td(td: timedelta) -> str:
    if not td or td.total_seconds() <= 0:
        return ""
    total_seconds = int(td.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    return f"{hours:02}:{minutes:02}"

def parse_time(s: str) -> str:
    if not s:
        return ""
    s = s.strip()
    return s if ":" in s else ""

def obter_faixa_periodo(mes_ref_extenso: str, ano_ref: int):
    meses_pt = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", 
                "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"]
    try:
        mes_index = meses_pt.index(mes_ref_extenso.upper()) + 1
    except ValueError:
        mes_index = datetime.now().month
    
    fim = datetime(int(ano_ref), mes_index, 25, 23, 59, 59)
    if mes_index == 1:
        inicio = datetime(int(ano_ref) - 1, 12, 26, 0, 0, 0)
    else:
        inicio = datetime(int(ano_ref), mes_index - 1, 26, 0, 0, 0)
    return inicio, fim

def calcular_duracao_minutos(inicio: str, intervalo: str, volta: str, termino: str) -> int:
    if not inicio or not termino or ":" not in inicio or ":" not in termino:
        return 0
    try:
        h1, m1 = map(int, inicio.split(":"))
        h2, m2 = map(int, termino.split(":"))
        min1 = h1 * 60 + m1
        min2 = h2 * 60 + m2
        if min2 < min1:
            min2 += 24 * 60
        bruto = min2 - min1

        if intervalo and volta and ":" in intervalo and ":" in volta:
            hi, mi = map(int, intervalo.split(":"))
            hv, mv = map(int, volta.split(":"))
            mini = hi * 60 + mi
            minv = hv * 60 + mv
            if minv < mini:
                minv += 24 * 60
            bruto = max(0, bruto - (minv - mini))

        return max(0, bruto)
    except Exception:
        return 0

def time_to_minutes(t_str: str) -> int:
    p = parse_time(t_str)
    if not p or ":" not in p:
        return 0
    try:
        h, m = p.split(":")
        return int(h) * 60 + int(m)
    except Exception:
        return 0

def minutes_to_time(m: int) -> str:
    m = max(0, min(1439, int(m)))
    return f"{m // 60:02d}:{m % 60:02d}"

def agrupar_para_pdf(registros: list, mes: str, ano: str) -> list:
    agrupado = {}
    inicio_p, fim_p = obter_faixa_periodo(mes, int(ano))
    curr = inicio_p.date()
    end = fim_p.date()

    while curr <= end:
        dt_str = curr.strftime("%Y-%m-%d")
        dt_obj = datetime(curr.year, curr.month, curr.day)
        agrupado[dt_str] = {
            "data": dt_obj,
            "semana": get_dia_semana(dt_obj),
            "inicio": "",
            "intervalo": "",
            "volta": "",
            "termino": "",
            "duracao_td": timedelta(0),
            "obs": [],
            "50_td": timedelta(0),
            "100_td": timedelta(0),
        }
        curr += timedelta(days=1)

    # 1. Expandir registros tratando virada de noite (início antes da meia-noite e término pós meia-noite)
    # Regra oficial: até 23:59 do dia, e 00:00 até término no dia seguinte
    segmentos_por_dia = {}

    def adicionar_segmento(dt_key: str, start_m: int, end_m: int, start_s: str, end_s: str, obs_text: str):
        if dt_key not in segmentos_por_dia:
            segmentos_por_dia[dt_key] = []
        segmentos_por_dia[dt_key].append({
            "start": start_m,
            "end": end_m,
            "start_str": start_s,
            "end_str": end_s,
            "obs": obs_text
        })

    for c in registros:
        d_raw = c.get("data")
        if isinstance(d_raw, str):
            try:
                d_obj = datetime.strptime(d_raw[:10], "%Y-%m-%d").date()
            except Exception:
                continue
        elif hasattr(d_raw, "date"):
            d_obj = d_raw.date()
        else:
            d_obj = d_raw

        ini_str = parse_time(c.get("inicio", ""))
        fim_str = parse_time(c.get("termino", ""))
        if not ini_str or not fim_str:
            continue

        ini_min = time_to_minutes(ini_str)
        fim_min = time_to_minutes(fim_str)
        obs_val = c.get("observacoes") or ""

        # Verifica se o atendimento cruza a meia-noite (término menor que início)
        if fim_min < ini_min:
            # Segmento 1: no próprio dia, das ini_str até 23:59
            dt1_str = d_obj.strftime("%Y-%m-%d")
            adicionar_segmento(dt1_str, ini_min, 1439, ini_str, "23:59", obs_val)

            # Segmento 2: no dia seguinte, das 00:00 até fim_str
            d_next = d_obj + timedelta(days=1)
            dt2_str = d_next.strftime("%Y-%m-%d")
            adicionar_segmento(dt2_str, 0, fim_min, "00:00", fim_str, obs_val)
        else:
            dt_str = d_obj.strftime("%Y-%m-%d")
            adicionar_segmento(dt_str, ini_min, fim_min, ini_str, fim_str, obs_val)

    # 2. Para cada dia da folha, agrupar horários sobrepostos e preencher colunas
    for dt_str, segs in segmentos_por_dia.items():
        if dt_str not in agrupado:
            continue

        # Observações (SOMENTE o que foi digitado em "Observações", sem textos extras)
        day_obs = []
        for s in segs:
            ob = str(s.get("obs") or "").strip()
            if ob and ob not in day_obs:
                day_obs.append(ob)
        agrupado[dt_str]["obs"] = day_obs

        # Ordenar os intervalos do dia por início e término
        segs.sort(key=lambda x: (x["start"], x["end"]))

        # Agrupamento de horários sobrepostos:
        # Quando houver sobreposição, agrupa demonstrando o início mais cedo e término mais tarde
        merged_intervals = []
        for s in segs:
            if not merged_intervals:
                merged_intervals.append({
                    "start": s["start"],
                    "end": s["end"],
                    "start_str": s["start_str"],
                    "end_str": s["end_str"]
                })
            else:
                prev = merged_intervals[-1]
                if s["start"] <= prev["end"]:
                    # Sobreposto ou contínuo! Agrupa início mais cedo e término mais tarde
                    if s["end"] > prev["end"]:
                        prev["end"] = s["end"]
                        prev["end_str"] = s["end_str"]
                else:
                    merged_intervals.append({
                        "start": s["start"],
                        "end": s["end"],
                        "start_str": s["start_str"],
                        "end_str": s["end_str"]
                    })

        # Alocação nas colunas da folha (INÍCIO, INTERVALO, VOLTA, TÉRMINO)
        n = len(merged_intervals)
        if n == 1:
            iv = merged_intervals[0]
            agrupado[dt_str]["inicio"] = iv["start_str"]
            agrupado[dt_str]["intervalo"] = ""
            agrupado[dt_str]["volta"] = ""
            agrupado[dt_str]["termino"] = iv["end_str"]
        elif n == 2:
            # 1º registro alocado em Início e Intervalo, 2º registro em Volta e Término
            iv1 = merged_intervals[0]
            iv2 = merged_intervals[1]
            agrupado[dt_str]["inicio"] = iv1["start_str"]
            agrupado[dt_str]["intervalo"] = iv1["end_str"]
            agrupado[dt_str]["volta"] = iv2["start_str"]
            agrupado[dt_str]["termino"] = iv2["end_str"]
        elif n >= 3:
            # 3 ou mais intervalos
            iv1 = merged_intervals[0]
            iv2 = merged_intervals[1]
            iv_last = merged_intervals[-1]
            agrupado[dt_str]["inicio"] = iv1["start_str"]
            agrupado[dt_str]["intervalo"] = iv1["end_str"]
            agrupado[dt_str]["volta"] = iv2["start_str"]
            agrupado[dt_str]["termino"] = iv_last["end_str"]

        # Duração total do dia (soma dos intervalos agrupados sem duplicar minutos sobrepostos)
        total_dia_minutos = sum(iv["end"] - iv["start"] for iv in merged_intervals)
        duracao_td = timedelta(minutes=total_dia_minutos)
        agrupado[dt_str]["duracao_td"] = duracao_td

        semana = agrupado[dt_str]["semana"]
        if semana in ["DOMINGO", "FERIADO"]:
            agrupado[dt_str]["100_td"] = duracao_td
        else:
            agrupado[dt_str]["50_td"] = duracao_td

    lista_final = []
    for dt_str in sorted(agrupado.keys()):
        item = agrupado[dt_str]
        lista_final.append({
            "data": item["data"],
            "semana": item["semana"],
            "inicio": item["inicio"],
            "intervalo": item["intervalo"],
            "volta": item["volta"],
            "termino": item["termino"],
            "duracao_td": item["duracao_td"],
            "horas_trabalhadas": format_td(item["duracao_td"]),
            "50_td": item["50_td"],
            "100_td": item["100_td"],
            "50%": format_td(item["50_td"]),
            "100%": format_td(item["100_td"]),
            "observacoes": " | ".join(item["obs"])
        })

    return lista_final

def gerar_pdf(registros: list, plantonista: str, mes: str, ano: str, output_path: str):
    # A4 Paisagem: 29.7cm (841.89pt) x 21.0cm (595.28pt)
    # Margens laterais de 1.0cm (28.35pt) -> Largura útil: 27.7cm (785.19pt)
    pts_cm = 28.35
    margin_x = 1.0 * pts_cm
    margin_y = 0.5 * pts_cm

    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(A4),
        rightMargin=margin_x,
        leftMargin=margin_x,
        topMargin=margin_y,
        bottomMargin=margin_y,
    )

    elems = []

    # ── Largura das Colunas em Proporção Exata da Planilha Excel ─────────────────
    # Medidas exatas fornecidas:
    # DIA: 183px | SEMANA: 183px | DATA: 183px | INÍCIO: 150px | INTERVALO: 150px
    # VOLTA: 150px | TÉRMINO: 150px | HORAS TRABALHADAS: 188px | 50%: 150px | 100%: 150px | OBSERVAÇÕES: 336px
    # Total de pixels = 2093px.
    # Largura disponível = 27.7cm = 785.19pt.
    px_total = 2093.0
    w_avail = 27.7 * pts_cm
    scale_w = w_avail / px_total

    col_widths = [
        183.0 * scale_w,  # 0: DIA (~2.42cm)
        183.0 * scale_w,  # 1: SEMANA (~2.42cm)
        183.0 * scale_w,  # 2: DATA (~2.42cm)
        150.0 * scale_w,  # 3: INÍCIO (~1.98cm)
        150.0 * scale_w,  # 4: INTERVALO (~1.98cm)
        150.0 * scale_w,  # 5: VOLTA (~1.98cm)
        150.0 * scale_w,  # 6: TÉRMINO (~1.98cm)
        188.0 * scale_w,  # 7: HORAS TRABALHADAS (~2.49cm)
        150.0 * scale_w,  # 8: 50% (~1.98cm)
        150.0 * scale_w,  # 9: 100% (~1.98cm)
        336.0 * scale_w,  # 10: OBSERVAÇÕES (~4.45cm)
    ]

    # ── Cabeçalho Unificado em 4 Linhas (Largura Exata da Tabela de Dados) ──────
    # Alturas especificadas pelo usuário:
    # Linha 1 (Título): 38px
    # Linha 2 (Espaçador título): 12px
    # Linha 3 (Info do plantonista): 32px
    # Linha 4 (Espaçador info): 12px
    # Total de 94px proporcional sem separação intermediária (bloco único contínuo)
    h_r1 = 20.0
    h_r2 = 6.0
    h_r3 = 18.0
    h_r4 = 6.0

    header_data = [
        # Linha 1: Título unificado cobrindo toda a largura (A1:K1)
        ["FOLHA DE HORA EXTRA", "", "", "", "", "", "", "", "", "", ""],
        # Linha 2: Espaçador interno
        ["", "", "", "", "", "", "", "", "", "", ""],
        # Linha 3: Dados do plantonista espelhando o Excel
        # B3: "COLABORADOR:" (à direita) | D3:E3: Nome (300px) | G3: "MÊS REFERENTE:" | H3: Mês | I3: "ANO:" | J3: Ano
        ["COLABORADOR:", "", "", str(plantonista).upper(), "", "", "MÊS REFERENTE:", str(mes).upper(), "ANO:", str(ano), ""],
        # Linha 4: Espaçador interno
        ["", "", "", "", "", "", "", "", "", "", ""]
    ]

    header_table = Table(header_data, colWidths=col_widths, rowHeights=[h_r1, h_r2, h_r3, h_r4])

    header_style = [
        # Fundo vinho em todo o bloco unificado
        ("BACKGROUND", (0, 0), (-1, -1), HEADER_BG),
        # Borda externa contínua (sem linha separando título das informações)
        ("BOX",        (0, 0), (-1, -1), 0.5, BLACK),

        # Linha 1: Título mesclado em toda a largura
        ("SPAN",       (0, 0), (10, 0)),
        ("FONTNAME",   (0, 0), (10, 0), DEFAULT_FONT_BOLD),
        ("FONTSIZE",   (0, 0), (10, 0), FS_TITLE),
        ("TEXTCOLOR",  (0, 0), (10, 0), TEXT_HEADER),
        ("ALIGN",      (0, 0), (10, 0), "CENTER"),
        ("VALIGN",     (0, 0), (10, 0), "MIDDLE"),

        # Linha 2: Espaçador
        ("SPAN",       (0, 1), (10, 1)),

        # Linha 3: Tipografia e alinhamento vertical
        ("VALIGN",     (0, 2), (-1, 2), "MIDDLE"),
        ("FONTNAME",   (0, 2), (-1, 2), DEFAULT_FONT_BOLD),
        ("FONTSIZE",   (0, 2), (-1, 2), FS_MAIN),

        # A3:B3: "COLABORADOR:" (mesclado e alinhado à direita)
        ("SPAN",         (0, 2), (1, 2)),
        ("ALIGN",        (0, 2), (1, 2), "RIGHT"),
        ("TEXTCOLOR",    (0, 2), (1, 2), TEXT_HEADER),
        ("RIGHTPADDING", (0, 2), (1, 2), 4),

        # D3:E3: "CAIQUE NOVAES" (mesclado = 300px proporcional, fundo cinza #d9d9d9 e texto preto)
        ("SPAN",        (3, 2), (4, 2)),
        ("BACKGROUND",  (3, 2), (4, 2), GRAY_NAME_BG),
        ("TEXTCOLOR",   (3, 2), (4, 2), TEXT_MAIN),
        ("ALIGN",       (3, 2), (4, 2), "LEFT"),
        ("LEFTPADDING", (3, 2), (4, 2), 6),
        ("BOX",         (3, 2), (4, 2), 0.5, BLACK),

        # G3: "MÊS REFERENTE:" (alinhado à direita)
        ("ALIGN",        (6, 2), (6, 2), "RIGHT"),
        ("TEXTCOLOR",    (6, 2), (6, 2), TEXT_HEADER),
        ("RIGHTPADDING", (6, 2), (6, 2), 4),

        # H3: Mês (fundo cinza #d9d9d9 e texto preto)
        ("BACKGROUND",  (7, 2), (7, 2), GRAY_NAME_BG),
        ("TEXTCOLOR",   (7, 2), (7, 2), TEXT_MAIN),
        ("ALIGN",       (7, 2), (7, 2), "CENTER"),
        ("BOX",         (7, 2), (7, 2), 0.5, BLACK),

        # I3: "ANO:" (alinhado à direita)
        ("ALIGN",        (8, 2), (8, 2), "RIGHT"),
        ("TEXTCOLOR",    (8, 2), (8, 2), TEXT_HEADER),
        ("RIGHTPADDING", (8, 2), (8, 2), 4),

        # J3: Ano (fundo cinza #d9d9d9 e texto preto)
        ("BACKGROUND",  (9, 2), (9, 2), GRAY_NAME_BG),
        ("TEXTCOLOR",   (9, 2), (9, 2), TEXT_MAIN),
        ("ALIGN",       (9, 2), (9, 2), "CENTER"),
        ("BOX",         (9, 2), (9, 2), 0.5, BLACK),

        # Linha 4: Espaçador
        ("SPAN",       (0, 3), (10, 3)),
    ]

    header_table.setStyle(TableStyle(header_style))
    elems.append(header_table)
    elems.append(Spacer(1, 4))

    # ── Cabeçalho de Colunas em Duas Linhas (Altura total: 60px proporcional) ────
    styles = getSampleStyleSheet()
    th_style = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName=DEFAULT_FONT_BOLD,
        fontSize=FS_MAIN * 0.9,
        leading=FS_MAIN * 1.05,
        textColor=TEXT_HEADER,
        alignment=1
    )

    header_row_0 = [
        "DIA", "SEMANA", "DATA",
        "INÍCIO", "INTERVALO", "VOLTA", "TÉRMINO",
        Paragraph("HORAS<br/>TRABALHADAS", th_style),
        "Horas a Receber", "",
        "OBSERVAÇÕES"
    ]
    header_row_1 = [
        "", "", "", "", "", "", "", "",
        "50%", "100%",
        ""
    ]

    total_worked = timedelta(0)
    total_50 = timedelta(0)
    total_100 = timedelta(0)

    destaque_idx = []
    data_rows = []

    dados_agrupados = agrupar_para_pdf(registros, mes, ano)

    for i, row in enumerate(dados_agrupados):
        semana = row["semana"]
        is_dest = semana in ("SÁBADO", "DOMINGO", "FERIADO")
        # Offset + 2 por conta das duas linhas de cabeçalho
        if is_dest:
            destaque_idx.append(i + 2)

        r = [
            row["data"].strftime("%d"),
            semana,
            row["data"].strftime("%d/%m/%Y"),
            row.get("inicio", ""),
            row.get("intervalo", ""),
            row.get("volta", ""),
            row.get("termino", ""),
            row.get("horas_trabalhadas", ""),
            row.get("50%", ""),
            row.get("100%", ""),
            row.get("observacoes", "")[:60],
        ]
        data_rows.append(r)

        total_worked += row.get("duracao_td", timedelta(0))
        total_50 += row.get("50_td", timedelta(0))
        total_100 += row.get("100_td", timedelta(0))

    footer = [
        "", "", "", "", "", "", "TOTAL:",
        format_td(total_worked),
        format_td(total_50),
        format_td(total_100),
        ""
    ]

    full_table_data = [header_row_0, header_row_1] + data_rows + [footer]

    # Altura do cabeçalho de colunas: 60px (dividido em 15pt e 14pt)
    h_header0 = 15.0
    h_header1 = 14.0
    h_content = 13.5
    h_footer  = 14.0

    row_heights = [h_header0, h_header1] + [h_content] * len(data_rows) + [h_footer]

    main_table = Table(full_table_data, colWidths=col_widths, rowHeights=row_heights)

    ts = [
        ("GRID",       (0, 0), (-1, -1), 0.5, BLACK),
        ("FONTNAME",   (0, 0), (-1, -1), DEFAULT_FONT),
        ("FONTSIZE",   (0, 0), (-1, -1), FS_MAIN),
        ("TEXTCOLOR",  (0, 0), (-1, -1), TEXT_MAIN),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 1),
        ("RIGHTPADDING", (0, 0), (-1, -1), 1),

        # Cabeçalho Dia, semana... (#c0504d e texto #ffffff)
        ("BACKGROUND", (0, 0), (-1, 1),  COL_HEADER_BG),
        ("TEXTCOLOR",  (0, 0), (-1, 1),  TEXT_HEADER),
        ("FONTNAME",   (0, 0), (-1, 1),  DEFAULT_FONT_BOLD),
        ("FONTSIZE",   (0, 0), (-1, 1),  FS_MAIN),

        # Spans verticais e horizontais idênticos à planilha
        ("SPAN", (0, 0), (0, 1)),   # DIA
        ("SPAN", (1, 0), (1, 1)),   # SEMANA
        ("SPAN", (2, 0), (2, 1)),   # DATA
        ("SPAN", (3, 0), (3, 1)),   # INÍCIO
        ("SPAN", (4, 0), (4, 1)),   # INTERVALO
        ("SPAN", (5, 0), (5, 1)),   # VOLTA
        ("SPAN", (6, 0), (6, 1)),   # TÉRMINO
        ("SPAN", (7, 0), (7, 1)),   # HORAS TRABALHADAS
        ("SPAN", (8, 0), (9, 0)),   # Horas a Receber
        ("SPAN", (10, 0), (10, 1)), # OBSERVAÇÕES

        # Observações alinhada à esquerda
        ("ALIGN",      (10, 2), (10, -2), "LEFT"),
        ("LEFTPADDING", (10, 2), (10, -2), 4),
    ]

    # Fins de semana e feriados com fundo #d9d9d9
    for idx in destaque_idx:
        ts.append(("BACKGROUND", (0, idx), (-1, idx), GRAY_WEEKEND))

    # Rodapé TOTAL: fundo #c0504d e texto branco
    ts.append(("FONTNAME",   (6, -1), (9, -1), DEFAULT_FONT_BOLD))
    ts.append(("FONTSIZE",   (6, -1), (9, -1), FS_MAIN))
    ts.append(("BACKGROUND", (6, -1), (9, -1), COL_HEADER_BG))
    ts.append(("TEXTCOLOR",  (6, -1), (9, -1), TEXT_HEADER))

    main_table.setStyle(TableStyle(ts))
    elems.append(main_table)

    # Constrói o PDF A4 Paisagem oficial sem campos de assinatura e sem dados monetários
    doc.build(elems)
    return output_path

def main():
    parser = argparse.ArgumentParser(description="Gerador de PDF de Horas Extras")
    parser.add_argument("--input", help="Caminho do arquivo JSON de entrada")
    parser.add_argument("--output", default="folha_horas_extras.pdf", help="Caminho do PDF de saída")
    parser.add_argument("--test", action="store_true", help="Executa teste sintético")

    args = parser.parse_args()

    if args.test:
        test_registros = [
            {
                "data": "2026-05-02",
                "inicio": "08:00",
                "intervalo": "12:00",
                "volta": "13:00",
                "termino": "17:00",
                "duracao_minutos": 480,
                "motivo": "Plantão de suporte aos hotéis",
                "observacoes": "Validação de virada"
            }
        ]
        gerar_pdf(test_registros, "CAIQUE NOVAES", "MAIO", "2026", args.output)
        print(f"TEST_OK: {args.output}")
        return

    if not args.input or not os.path.exists(args.input):
        sys.stderr.write("Erro: Arquivo de entrada JSON não fornecido ou inexistente.\n")
        sys.exit(1)

    with open(args.input, "r", encoding="utf-8") as f:
        payload = json.load(f)

    registros = payload.get("registros", [])
    plantonista = payload.get("plantonista", "PLANTONISTA")
    mes = payload.get("mes", "JANEIRO")
    ano = payload.get("ano", str(datetime.now().year))

    gerar_pdf(registros, plantonista, mes, ano, args.output)
    print(f"PDF_GENERATED: {args.output}")

if __name__ == "__main__":
    main()
