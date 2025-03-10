import pandas as pd

# Script which deletes books with no subject data

df = pd.read_csv("data/books_updated_prelim.csv", encoding="utf-8", delimiter=";")

# Remove rows where "subjects" column is empty
df = df[df['subjects'] != "[]"]

df.to_csv("data/books_without_empty_subjects.csv", index=False, encoding="utf-8", sep=";")

print("Rows with empty 'subjects' column removed. Saved as books_without_empty_subjects.csv.")
