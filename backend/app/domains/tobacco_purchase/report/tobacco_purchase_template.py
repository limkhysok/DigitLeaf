import io

import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side


def build_tobacco_purchase_template() -> io.BytesIO:
    """Build the blank, printable tobacco-purchase settlement form as an .xlsx stream."""
    wb = openpyxl.Workbook()
    ws = wb.worksheets[0]
    ws.title = "Sheet1"

    # Ensure grid lines are visible
    ws.views.sheetView[0].showGridLines = True

    # Styles
    khmer_font_title = Font(name="Arial", size=16, bold=True)
    khmer_font_bold = Font(name="Arial", size=11, bold=True)
    khmer_font_regular = Font(name="Arial", size=11, bold=False)

    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left_align = Alignment(horizontal="left", vertical="center")

    thin_side = Side(border_style="thin", color="000000")
    full_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

    # Titles and headers (rows 1-6)
    ws["C2"] = "របាយការណ៍ទូទាត់ វិក្កយបត្រទិញសន្លឹកថ្នាំជក់លើកៗ"
    ws["C2"].font = khmer_font_title
    ws["C2"].alignment = center_align
    ws.merge_cells("C2:G3")

    ws["A4"] = "អ្នកតំណាង : ............................................................................"
    ws["A4"].font = khmer_font_bold
    ws["A4"].alignment = left_align

    ws["E4"] = "ថ្ងៃ/ខែ/ឆ្នាំ: ............................................................................"
    ws["E4"].font = khmer_font_bold
    ws["E4"].alignment = left_align

    ws["A5"] = "តំបន់ : ............................................................................"
    ws["A5"].font = khmer_font_bold
    ws["A5"].alignment = left_align

    ws["E5"] = "ទីតាំង/ឡ: ............................................................................"
    ws["E5"].font = khmer_font_bold
    ws["E5"].alignment = left_align

    # Table headers (rows 8-9)
    headers = {
        "A8": "ល.រ",
        "B8": "លេខកូដ\nFarmer ID",
        "C8": "លេខប័ណ្ណ\nInv No",
        "D8": "ប្រភេទ\nGrade",
        "E8": "ចំនួនគីឡូ\nQty Kg",
        "F8": "តម្លៃរាយ\nUnit Price",
        "G8": "តម្លៃសរុប\nTotal Amount",
        "H8": "សម្គាល់\nRemark",
    }

    for cell_ref, text in headers.items():
        ws[cell_ref] = text
        ws[cell_ref].font = khmer_font_bold
        ws[cell_ref].alignment = center_align

        # Merge row 8 and 9 for each column header
        col_letter = cell_ref[0]
        ws.merge_cells(f"{col_letter}8:{col_letter}9")

        # Apply borders to the header cells
        ws[f"{col_letter}8"].border = full_border
        ws[f"{col_letter}9"].border = full_border

    # Blank data grid (rows 10-36), equal row heights, for filling in by hand
    for row_idx in range(10, 37):
        ws.row_dimensions[row_idx].height = 30

        # Row numbers in column A (1 to 27)
        ws[f"A{row_idx}"] = row_idx - 9
        ws[f"A{row_idx}"].font = khmer_font_regular
        ws[f"A{row_idx}"].alignment = center_align

        for col_letter in ["A", "B", "C", "D", "E", "F", "G", "H"]:
            cell = ws[f"{col_letter}{row_idx}"]
            cell.border = full_border
            if col_letter != "A":
                cell.alignment = center_align

    # Column widths
    column_widths = {
        "A": 8,   # No.
        "B": 15,  # Farmer ID
        "C": 15,  # Inv No
        "D": 12,  # Grade
        "E": 14,  # Qty Kg
        "F": 14,  # Unit Price
        "G": 16,  # Total Amount
        "H": 16,  # Remark
    }

    for col_letter, width in column_widths.items():
        ws.column_dimensions[col_letter].width = width

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream
