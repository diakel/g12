import pandas as pd
import json
from collections import defaultdict

# Script which creates a json file to use in the sunburst chart

df = pd.read_csv("data/books_without_empty_subjects.csv", encoding="utf-8", delimiter=";")

df = df.fillna("")

data = {"name": "United States", "children": []}

district_dict = defaultdict(lambda: defaultdict(list))

for _, row in df.iterrows():
    title = row["title"]
    author = row["author"]
    description = row["description"]if pd.notna(row["description"]) else "" 
    district = row["district"]

    subjects = [s.strip() for s in row["subjects"].split(",")] if isinstance(row["subjects"], str) else []

    for subject in subjects:
        district_dict[district][subject].append({
            "name": title,
            "author": author,
            "description": description
        })


for district, subjects in district_dict.items():
    district_node = {"name": district, "children": []}

    for subject, books in subjects.items():
        district_node["children"].append({
            "name": subject,
            "children": books
        })

    data["children"].append(district_node)


with open("data/books_hierarchy.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("JSON file created: books_hierarchy.json")