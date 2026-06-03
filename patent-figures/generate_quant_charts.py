from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "quantitative-output"
OUT.mkdir(parents=True, exist_ok=True)


def save(fig: plt.Figure, stem: str) -> None:
    fig.tight_layout()
    fig.savefig(OUT / f"{stem}.svg", format="svg", dpi=300, bbox_inches="tight")
    fig.savefig(OUT / f"{stem}.png", format="png", dpi=300, bbox_inches="tight")
    plt.close(fig)


def fig_09() -> None:
    df = pd.read_csv(ROOT / "fig-09-data.csv")
    x = range(len(df))
    y = df["balanced_accuracy"]

    fig, ax = plt.subplots(figsize=(10.5, 6.2))
    bars = ax.bar(x, y, color=["#607d8b", "#26a69a", "#ef6c00"], edgecolor="#1f2937", linewidth=0.8)
    ax.set_xticks(list(x), df["configuration"], rotation=10, ha="right")
    ax.set_ylim(0.5, 1.0)
    ax.set_ylabel("Balanced Accuracy")
    ax.set_title("FIG. 9 Comparative Screening Performance")
    ax.grid(axis="y", linestyle="--", alpha=0.3)
    for bar, val in zip(bars, y):
        ax.text(bar.get_x() + bar.get_width() / 2, val + 0.01, f"{val:.3f}", ha="center", va="bottom", fontsize=9)
    save(fig, "fig-09")


def fig_10() -> None:
    df = pd.read_csv(ROOT / "fig-10-data.csv")
    x = range(len(df))
    width = 0.34

    fig, ax = plt.subplots(figsize=(11.5, 6.8))
    before = ax.bar([i - width / 2 for i in x], df["before_normalization"], width, label="Before", color="#90a4ae")
    after = ax.bar([i + width / 2 for i in x], df["after_normalization"], width, label="After", color="#00796b")
    ax.plot(list(x), df["max_allowed"], color="#d32f2f", marker="o", linewidth=1.6, label="Max Allowed")
    ax.set_xticks(list(x), df["section_key"], rotation=18, ha="right")
    ax.set_ylabel("Section Score")
    ax.set_title("FIG. 10 Score Normalization Before and After Bounded Correction")
    ax.grid(axis="y", linestyle="--", alpha=0.3)
    ax.legend()
    for bar, val in zip(before, df["before_normalization"]):
        ax.text(bar.get_x() + bar.get_width() / 2, val + 0.06, f"{val:.1f}", ha="center", va="bottom", fontsize=8)
    for bar, val in zip(after, df["after_normalization"]):
        ax.text(bar.get_x() + bar.get_width() / 2, val + 0.06, f"{val:.1f}", ha="center", va="bottom", fontsize=8)
    save(fig, "fig-10")


def fig_11() -> None:
    df = pd.read_csv(ROOT / "fig-11-data.csv")
    x = range(len(df))

    components = [
        ("cognitive_contribution", "#455a64", "Cognitive"),
        ("olfactory_contribution", "#2e7d32", "Olfactory"),
        ("auditory_contribution", "#1565c0", "Auditory"),
        ("visual_contribution", "#8e24aa", "Visual"),
        ("optional_eeg_contribution", "#ef6c00", "Optional EEG"),
        ("optional_biomarker_contribution", "#c62828", "Optional Biomarker"),
    ]

    fig, ax = plt.subplots(figsize=(11.0, 6.5))
    bottom = pd.Series([0.0] * len(df))
    for key, color, label in components:
        ax.bar(x, df[key], bottom=bottom, color=color, edgecolor="#263238", linewidth=0.5, label=label)
        bottom += df[key]

    ax2 = ax.twinx()
    ax2.plot(x, df["composite_risk_score"], color="#111827", marker="o", linewidth=1.8, label="Composite Risk")
    ax2.set_ylim(0.45, 0.85)
    ax2.set_ylabel("Composite Risk Score")

    ax.set_xticks(list(x), df["case_id"])
    ax.set_ylabel("Contribution Magnitude")
    ax.set_title("FIG. 11 Explainable Modality Contribution Profile")
    ax.grid(axis="y", linestyle="--", alpha=0.25)

    h1, l1 = ax.get_legend_handles_labels()
    h2, l2 = ax2.get_legend_handles_labels()
    ax.legend(h1 + h2, l1 + l2, loc="upper left", fontsize=8)
    save(fig, "fig-11")


def fig_12() -> None:
    df = pd.read_csv(ROOT / "fig-12-data.csv")
    x = df["visit_index"]
    y = df["composite_risk_score"]
    threshold = df["referral_threshold"]

    fig, ax = plt.subplots(figsize=(10.8, 6.2))
    ax.plot(x, y, color="#0d47a1", marker="o", linewidth=2.2, label="Composite Risk Score")
    ax.plot(x, threshold, color="#b71c1c", linestyle="--", linewidth=1.8, label="Referral Threshold")

    for i, row in df.iterrows():
        if str(row["referral_triggered"]).strip().lower() == "yes":
            ax.scatter(row["visit_index"], row["composite_risk_score"], color="#b71c1c", s=70, zorder=4)
            ax.text(row["visit_index"], row["composite_risk_score"] + 0.012, "Referral", ha="center", fontsize=8)

    ax.set_xticks(df["visit_index"], df["visit_label"], rotation=0)
    ax.set_ylim(0.48, 0.8)
    ax.set_ylabel("Composite Risk Score")
    ax.set_title("FIG. 12 Longitudinal Risk Trajectory and Referral Threshold")
    ax.grid(axis="y", linestyle="--", alpha=0.3)
    ax.legend()
    save(fig, "fig-12")


def main() -> None:
    fig_09()
    fig_10()
    fig_11()
    fig_12()
    print("Generated FIG. 9-12 charts in patent-figures/quantitative-output")


if __name__ == "__main__":
    main()