import pandas as pd

df = pd.read_csv("data/books_updated_prelim.csv", encoding="utf-8", delimiter=";")

# split subjects
unique_subjects = set()
for subjects in df["subjects"].dropna():
    subjects_list = [s.strip() for s in subjects.split(",")]
    unique_subjects.update(subjects_list)

subjects_df = pd.DataFrame(sorted(unique_subjects), columns=["subject"])
subjects_df.to_csv("unique_subjects.csv", index=False, encoding="utf-8", sep=";")

# Print unique subjects
#print("\n".join(sorted(unique_subjects)))
#df.to_csv("individual_subjects.csv", index = False, encoding="utf-8", sep=";")
