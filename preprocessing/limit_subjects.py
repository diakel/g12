import pandas as pd

priority_subjects = [
    "lbgtq+", "coming of age", "young adult", "juvenile", "romance", "science fiction", "fantasy", "contemporary", "mystery", "thriller", 
    "historical fiction", "horror", "non-fiction", "comics & graphic novels", "classics", "religion", "family problems", "fiction", "humour", "biography", "children's books"
]

invalid_subjects = {"self service", "subjects", "[]", "custom stores", "united states", "kindle store"}

df = pd.read_csv("data/books_without_empty_subjects.csv", encoding="utf-8", delimiter=";")

def assign_subject(subjects_str):
    if pd.isna(subjects_str):
        return ""

    subjects_list = [s.strip().lower() for s in subjects_str.split(",")]

    subjects_list = [s for s in subjects_list if s not in invalid_subjects]

    if not subjects_list:
        return ""

    for priority in priority_subjects:
        for subject in subjects_list:
            if priority in subject:
                return priority.title()

    return subjects_list[0].title() if subjects_list else ""

df["subjects"] = df["subjects"].apply(assign_subject)

df.to_csv("data/books_single_subject.csv", index=False, encoding="utf-8", sep=";")