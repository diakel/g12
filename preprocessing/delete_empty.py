import pandas as pd

# deleting rows with no subject data

df = pd.read_csv("data/books_single_subject.csv", encoding="utf-8", delimiter=";")

df['subjects'] = df['subjects'].astype(str).str.strip()
df = df[~df['subjects'].isin(["nan", "[]", "", None])]

df.to_csv("data/books_without_empty_subjects_2.csv", index=False, encoding="utf-8", sep=";")