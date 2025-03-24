import json

# Script to merge different datasets together. The input json datasets are not in the data folder.

def load_json(filename):
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# Create unique book identifier (title + author)
def get_book_id(book):
    return f"{book['title'].strip().lower()}|{book['author'].strip().lower()}"

# Files to merge
genres_cleaned = load_json("genres_cleaned.json")
book_subjects_google = load_json("book_subjects_google.json")
book_subjects_openlib = load_json("book_subjects_openlib.json")

# Create lookup dictionaries for quick merging
google_lookup = {get_book_id(book): book for book in book_subjects_google}
openlib_lookup = {get_book_id(book): book for book in book_subjects_openlib}

# Merge data
merged_books = []

for book in genres_cleaned:
    book_id = get_book_id(book)

    openlib_data = openlib_lookup.get(book_id, {})
    google_data = google_lookup.get(book_id, {})

    subjects = list(set(book.get("subjects", []) + openlib_data.get("subjects", []) + google_data.get("subjects", [])))
    subjects = subjects[:5]

    # Merge synopsis (prefer Open Library, fallback to Google)
    description = openlib_data.get("synopsis") or google_data.get("synopsis") or book.get("synopsis")

    # Create the merged book entry
    merged_book = {
        "title": book["title"],
        "author": book["author"],
        "subjects": subjects,
        "synopsis": description
    }

    merged_books.append(merged_book)

# Save the merged data to a new file
save_json(merged_books, "merged_books_genres.json")

print("Merge complete! Saved to merged_books.json.")