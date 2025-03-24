#import requests as req
     
#h = {'Authorization': '59580_caeaa219a643f2b97c597a733e8a86d1'}
#resp = req.get("https://api2.isbndb.com/books/Wings%20of%20Shadow%20(Crown%20of%20Feathers%20Series)?page=1&pageSize=5&column=title", headers=h)
#print(resp.json())

import requests
import csv
import time
import json
import urllib.parse
import pandas as pd

# Script to fill query API to fill the missing subjects and description for the books. Right now it's open library API, nearly the same script was used for
# Google Books API and ISBNdb API. Input json datasets are not in the data in the repo.

API_KEY = "AIzaSyAJ0gmeSp2-Uf0S6Cfpxkw_0z_CosEmpEA"
HEADERS = {"Authorization": API_KEY}
BASE_URL = "https://openlibrary.org/search.json?"

INPUT_CSV = "books.csv"
INPUT_CSV_CLEANED = "books_cleaned.csv"
INPUT_JSON =  "books_without_subjects_400.json"
OUTPUT_JSON = "book_subjects_openlib.json"

def query_isbndb(title, author):
    """Queries API by title, then filters by author."""
    #encoded_title = urllib.parse.quote(title)
    encoded_title = urllib.parse.quote_plus(title)
    encoded_author = urllib.parse.quote_plus(author)
    #query = f"{encoded_title}+{encoded_author}"
    url = f"{BASE_URL}title={encoded_title}&author={encoded_author}&fields=title,author_name,subject"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        #print(data)
        books = data.get("docs", [])
        
        # Normalize input author
        normalized_author = author.lower().strip()
        #print(books)

        # Find first book where author matches
        for book in books:
            book_authors = [a.lower().strip() for a in book.get("author_name", [])]
            if any(normalized_author in a for a in book_authors):
                return book 

    # If no match, try searching by author
    #encoded_author = urllib.parse.quote(author)
    #url = f"{BASE_URL}/{encoded_author}?page=1&pageSize=5&column=author"
    #response = requests.get(url, headers=HEADERS)

    #if response.status_code == 200:
    #    data = response.json()
    #    books = data.get("books", [])
    #    return books[0] if books else None  # Return first result if available

    return None

def process_books():
    results = []
    #df = pd.read_csv(INPUT_CSV, delimiter=";", encoding="utf-8-sig")
    #df_cleaned = df.drop_duplicates(keep="first")
    #print(len(df_cleaned))
    #df_cleaned.to_csv(INPUT_CSV_CLEANED, index=False, sep=";", encoding="utf-8-sig")

    with open(INPUT_JSON, "r", encoding="utf-8") as file:
        #reader = csv.DictReader(csvfile, delimiter="\t")
        #reader = csv.reader(file, delimiter=";")
        reader = json.load(file)

        for count, row in enumerate(reader, start=1):
            author_orig = row["author"]
            title_orig = row["title"]
            author = row["author"].strip()
            title = row["title"].strip()
            book = query_isbndb(title, author)
            if book:
                if "subject" in book:
                    results.append({
                        "author": author_orig,
                        "title": title_orig,
                        "subjects": book.get("subject", [])[:5],
                        "synopsis": ""
                })
            else:
                results.append({
                    "author": author_orig,
                    "title": title_orig,
                    "subjects": [],
                    "synopsis": ""
                })
            if count % 10 == 0:
                with open(OUTPUT_JSON, "a", encoding="utf-8") as outfile:
                    json.dump(results, outfile, indent=4)
                    results.clear()
                    print(count)
            if count > 901:
                break

            time.sleep(1)

    if results:
        with open(OUTPUT_JSON, "a", encoding="utf-8") as outfile:
            json.dump(results, outfile, indent=4)

process_books()