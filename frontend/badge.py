# script for extracting code coverage value for readme

from bs4 import BeautifulSoup
import json

def extract_coverage_data(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        html_content = file.read()
    soup = BeautifulSoup(html_content, "lxml")
    div = soup.find("div", class_="fl pad1y space-right2")
    percentage = div.find("span", class_="strong").get_text(strip=True)
    return {"frontend": percentage}

def save_to_json(data, output_path):
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4)


html_file_path = "./coverage/lcov-report/index.html"
json_file_path = "./coverage-report.json"

coverage_data = extract_coverage_data(html_file_path)

save_to_json(coverage_data, json_file_path)

print(f"Coverage data has been saved to {json_file_path}")
