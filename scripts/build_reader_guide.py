#!/usr/bin/env python3
"""Build the 6x9 Valegast Manor Reader Guide website edition."""

from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "downloads" / "valegast-manor-reader-guide.pdf"
PAGE_W, PAGE_H = 6 * inch, 9 * inch

INK = colors.HexColor("#17130d")
PAPER = colors.HexColor("#f7f0df")
CREAM = colors.HexColor("#f3ead6")
GOLD = colors.HexColor("#9c7a35")
DARK_GOLD = colors.HexColor("#6d5325")
MUTED = colors.HexColor("#665d4f")

COVER = ROOT / "images" / "reader-guide" / "valegast-manor-reader-guide-cover.jpg"
MAP = ROOT / "images" / "maps" / "valegast-manor.webp"
MANOR_COVER = ROOT / "images" / "covers" / "manor.jpg"
LANTERN = ROOT / "images" / "brand" / "black-lantern-symbol.png"


def fitted(path: Path, max_w: float, max_h: float) -> Image:
    with PILImage.open(path) as source:
        width, height = source.size
    scale = min(max_w / width, max_h / height)
    return Image(str(path), width=width * scale, height=height * scale)


def first_page(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0f0f0d"))
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.drawImage(
        str(COVER),
        0,
        0,
        width=PAGE_W,
        height=PAGE_H,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1)
    canvas.rect(0.25 * inch, 0.25 * inch, PAGE_W - 0.5 * inch, PAGE_H - 0.5 * inch)
    canvas.restoreState()


def later_pages(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.8)
    canvas.rect(0.34 * inch, 0.34 * inch, PAGE_W - 0.68 * inch, PAGE_H - 0.68 * inch)
    canvas.setStrokeColor(colors.HexColor("#cbb887"))
    canvas.setLineWidth(0.3)
    canvas.rect(0.41 * inch, 0.41 * inch, PAGE_W - 0.82 * inch, PAGE_H - 0.82 * inch)
    canvas.setFont("Helvetica", 7.2)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(PAGE_W / 2, 0.22 * inch, f"R. Keith Parker | Valegast Manor Reader Guide | {doc.page}")
    canvas.restoreState()


def make_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "GuideTitle",
            parent=base["Title"],
            fontName="Times-Bold",
            fontSize=23,
            leading=26,
            alignment=TA_CENTER,
            textColor=INK,
            spaceAfter=10,
        ),
        "eyebrow": ParagraphStyle(
            "Eyebrow",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.6,
            leading=10,
            alignment=TA_CENTER,
            textColor=DARK_GOLD,
            spaceAfter=13,
        ),
        "heading": ParagraphStyle(
            "GuideHeading",
            parent=base["Heading2"],
            fontName="Times-Bold",
            fontSize=17,
            leading=20,
            textColor=INK,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "subheading": ParagraphStyle(
            "GuideSubheading",
            parent=base["Heading3"],
            fontName="Times-Bold",
            fontSize=11.5,
            leading=14,
            textColor=DARK_GOLD,
            spaceBefore=4,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "GuideBody",
            parent=base["BodyText"],
            fontName="Times-Roman",
            fontSize=10.1,
            leading=14.2,
            textColor=INK,
            spaceAfter=7,
        ),
        "small": ParagraphStyle(
            "GuideSmall",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.6,
            leading=10.2,
            textColor=MUTED,
            spaceAfter=4,
        ),
        "quote": ParagraphStyle(
            "GuideQuote",
            parent=base["BodyText"],
            fontName="Times-Italic",
            fontSize=11.1,
            leading=15,
            leftIndent=16,
            rightIndent=16,
            alignment=TA_CENTER,
            textColor=DARK_GOLD,
            spaceBefore=8,
            spaceAfter=10,
        ),
        "badge": ParagraphStyle(
            "LawBadge",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            alignment=TA_CENTER,
            textColor=CREAM,
        ),
    }


def law(number: str, title: str, copy: str, styles) -> Table:
    badge = Table([[Paragraph(number, styles["badge"])]], colWidths=[0.33 * inch], rowHeights=[0.33 * inch])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DARK_GOLD),
        ("BOX", (0, 0), (-1, -1), 0.5, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    table = Table(
        [[badge, [Paragraph(title, styles["subheading"]), Paragraph(copy, styles["body"])]]],
        colWidths=[0.52 * inch, 4.05 * inch],
        hAlign="LEFT",
    )
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def add_paragraphs(story, texts, style):
    for text in texts:
        story.append(Paragraph(text, style))


def build() -> None:
    for asset in (COVER, MAP, MANOR_COVER, LANTERN):
        if not asset.exists():
            raise FileNotFoundError(asset)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=(PAGE_W, PAGE_H),
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.68 * inch,
        bottomMargin=0.62 * inch,
        title="Valegast Manor Reader Guide",
        author="R. Keith Parker",
        subject="A companion to The Manor That Drank the Road",
    )

    story = [Spacer(1, doc.height), PageBreak()]

    story.extend([
        fitted(LANTERN, 0.7 * inch, 0.9 * inch),
        Spacer(1, 7),
        Paragraph("Valegast Manor Reader Guide", styles["title"]),
        Paragraph("A FREE ILLUSTRATED COMPANION TO <i>THE MANOR THAT DRANK THE ROAD</i>", styles["eyebrow"]),
        Paragraph("Welcome to the Lantern Road", styles["heading"]),
    ])
    add_paragraphs(story, [
        "Dear Reader,",
        "Thank you for finding your way to the Lantern Road. Valegast Manor is the first haunted threshold in The Black Lantern Cycle, and this guide is meant to be carried beside it: part map, part warning, and part witness record.",
        "Inside you will find the official manor map, five guest-laws worth remembering, a spoiler-light introduction to Cael Veyr and the Black Lantern, an opening passage from Book One, and a glimpse of the road that waits in Book Two.",
        "The stories in this cycle ask what happens when kindness becomes an obligation, when grief is made useful to strangers, and when a house is allowed to write the law of everyone beneath its roof. The Lantern does not make those questions easy. It only makes them visible.",
        "I hope Valegast stays with you long after the last door closes.",
        "Walk carefully,<br/><b>R. Keith Parker</b>",
    ], styles["body"])
    story.append(PageBreak())

    story.extend([
        Paragraph("Valegast Manor at a Glance", styles["title"]),
        Paragraph("BEFORE THE HOUSE OPENS", styles["eyebrow"]),
        fitted(MANOR_COVER, 2.05 * inch, 3.15 * inch),
        Spacer(1, 9),
    ])
    overview = Table([
        ["PLACE", "The Eltwald March"],
        ["WITNESS", "Cael Veyr"],
        ["INSTRUMENT", "The Black Lantern"],
        ["DANGER", "Hospitality entered as debt"],
    ], colWidths=[1.1 * inch, 3.55 * inch])
    overview.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), DARK_GOLD),
        ("TEXTCOLOR", (0, 0), (0, -1), CREAM),
        ("TEXTCOLOR", (1, 0), (1, -1), INK),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Times-Roman"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b7a474")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.extend([
        overview,
        Spacer(1, 10),
        Paragraph("The first riderless horse returns in the rain. The third carries a seal from House Valegast. Road-witness Cael Veyr follows the evidence to a manor where welcome is binding, breakfast is judgment, and every kindness can be entered as debt.", styles["body"]),
        Paragraph("Never thank a house for opening its mouth.", styles["quote"]),
        PageBreak(),
    ])

    story.extend([
        Paragraph("Five Laws Every Guest Should Know", styles["title"]),
        Paragraph("GUEST-LAW", styles["eyebrow"]),
        law("1", "A welcome may become a debt.", "A gift freely offered can still be entered into a house ledger as obligation. Ask who records the kindness and who benefits from the record.", styles),
        law("2", "Do not thank the house.", "Gratitude can be heard as consent when the listener is older than the custom. Thank the person, if you must. Never thank the walls.", styles),
        law("3", "The third bell binds what the first two invite.", "Repeated ceremony changes hospitality into judgment. Leave before a custom becomes the only law the room recognizes.", styles),
        law("4", "A hidden name is still evidence.", "When a guest is absent from the record, ask who had the authority to remove them and who was spared by the erasure.", styles),
        law("5", "A closed door is not proof of safety.", "At Valegast Manor, the sealed threshold may be the most honest thing in the house. The open door is the one making a claim.", styles),
        PageBreak(),
    ])

    story.extend([
        Paragraph("Valegast Manor", styles["title"]),
        Paragraph("OFFICIAL INTERIOR MAP", styles["eyebrow"]),
        fitted(MAP, doc.width, 6.35 * inch),
        Spacer(1, 7),
        Paragraph("Read the thresholds before you read the rooms. The route a house permits is often the first version of its law.", styles["small"]),
        PageBreak(),
    ])

    story.extend([
        Paragraph("The Witness and the Light", styles["title"]),
        Paragraph("CAEL VEYR AND THE BLACK LANTERN", styles["eyebrow"]),
        Paragraph("Cael Veyr", styles["heading"]),
        Paragraph("A road-worn witness who has learned that surviving a haunted law is not the same as answering it. Cael carries proof objects, a carving roll, an ash-root pipe, and the burden of refusing comforts that demand agreement before they reveal their price.", styles["body"]),
        Paragraph("The Black Lantern", styles["heading"]),
        Paragraph("The Lantern does not banish darkness. It reveals what the darkness has agreed to call necessary, and who was made to pay for that agreement. Its light is witness rather than weapon, which means using it always risks changing the person who carries it.", styles["body"]),
        Paragraph("Object first. Human cost next.", styles["quote"]),
        Paragraph("Three questions to carry", styles["heading"]),
    ])
    questions = Table([
        ["1", "Who wrote the rule?"],
        ["2", "Who benefits when it is obeyed?"],
        ["3", "Who disappears from the record?"],
    ], colWidths=[0.42 * inch, 4.25 * inch])
    questions.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), DARK_GOLD),
        ("TEXTCOLOR", (0, 0), (0, -1), CREAM),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Times-Roman"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b7a474")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.extend([questions, PageBreak()])

    story.extend([
        Paragraph("Road Without Return", styles["title"]),
        Paragraph("BOOK ONE - CHAPTER ONE - SPOILER-LIGHT PASSAGE", styles["eyebrow"]),
    ])
    add_paragraphs(story, [
        "The horse came back without its rider.",
        "It came out of the rain at dusk, black from mane to fetlock, one broken rein dragging through the mud and a coach trace snapped against its flank. No blood showed on the saddle. No pack hung from the straps. No human voice followed it down the road.",
        "Only the horse. Only the rain.",
        "Only the sound of hooves striking puddles in a measured, exhausted way, as if the animal had walked from a place where running had been forbidden.",
        "Cael Veyr stood beneath the old toll stone and let the horse come to him. The stone had once marked the lower road into the Eltwald March, back when lords still counted wheels, hooves, sacks of grain, and men walking beside a cart. Most travelers took the bridge road now. The toll stone had been left to moss, old law, and birds that liked to watch from dead branches.",
        "Cael had come because of the horse. More exactly, he had come because this was the third horse returned in six weeks, and the first two had carried no rider either.",
        "The Black Lantern burned in his left hand. Its flame was not large. It did not throw honest warmth. It sat behind blackened glass and burned the color of old honey until the horse crossed the line of the toll stone. Then the flame bent hard toward the animal.",
        "Cael tightened his grip.",
        "Easy, he said.",
        "The horse stopped three paces from him, heaving sides. Its eyes rolled white. Rain ran off its jaw and fell in long strings from the bit.",
        "Horses remembered roads better than men remembered promises.",
    ], styles["body"])
    story.append(PageBreak())

    story.extend([
        Paragraph("The Road Beyond Valegast", styles["title"]),
        Paragraph("BOOK TWO - THE VALLEY THAT LAUGHED AT THE LANTERN", styles["eyebrow"]),
        Paragraph("The road into the valley wore festival colors before it showed a single house.", styles["quote"]),
        Paragraph("Festival ribbons lead Cael into Gleann Si, where the first public laugh after grief can decide what the valley is permitted to remember. A grieving mother is required to smile over her child's coffin, and beauty has been trained to outrank witness.", styles["body"]),
        Paragraph("Cael is joined by Elyra Thornmere, a half-elven grief-keeper who refuses to let song turn another person's sorrow into public property, and Pipkin Thornwisp, Keeper of Small Apologies, whose smallest truths can interrupt the valley's grandest performance.", styles["body"]),
        Paragraph("Never ask a mourner to smile so the crowd may call itself kind.", styles["quote"]),
        Spacer(1, 14),
        fitted(LANTERN, 0.78 * inch, 1.02 * inch),
        Spacer(1, 7),
        Paragraph("Continue the Lantern Road", styles["heading"]),
        Paragraph("Books One and Two are available now. Book Three, <i>The Chateau That Wrote the Living</i>, remains in development and is presented only as an advance preview.", styles["body"]),
        Paragraph("Visit rkeithparkerbooks.com for book pages, excerpts, maps, reader news, and the Chronicle Library.", styles["body"]),
        PageBreak(),
    ])

    story.extend([
        Spacer(1, 0.55 * inch),
        fitted(LANTERN, 1.05 * inch, 1.4 * inch),
        Spacer(1, 14),
        Paragraph("Thank You for Carrying the Light", styles["title"]),
        Paragraph("R. KEITH PARKER", styles["eyebrow"]),
        Paragraph("R. Keith Parker is a Tennessee social studies teacher, former coach, farmer, husband, father of two, and grandfather of three. His fiction blends Gothic atmosphere, supernatural law, historical texture, perilous journeys, and classic fantasy adventure.", styles["body"]),
        Paragraph("Official website: rkeithparkerbooks.com", styles["quote"]),
        Paragraph("Reader email: keith@rkeithparkerbooks.com", styles["body"]),
        Paragraph("This website edition may be shared for personal reading. Text and artwork remain copyright R. Keith Parker. All rights reserved.", styles["small"]),
    ])

    doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
    print(f"Built {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    build()
