# active-commiters-filters

A client-side web application for analyzing active committers from CSV data. This tool helps you count unique users and filter them by repository.

## Features

- **CSV File Import**: Load user commit data from CSV files
- **User Deduplication**: Automatically counts unique users (same login = same user)
- **Repository Filtering**: Filter users by specific repositories using a textarea
- **Real-time Statistics**: View total users and filtered user counts
- **Clean UI**: Modern, responsive interface built with HTML, CSS, and JavaScript

## CSV Format

The CSV file should have the following headers:
```
User login,Organization / repository,Last pushed date,Last pushed email
```

Example:
```csv
User login,Organization / repository,Last pushed date,Last pushed email
john_doe,github/project-alpha,2025-10-15,john.doe@example.com
jane_smith,github/project-beta,2025-10-14,jane.smith@example.com
```

## Usage

Simply open `index.html` in your browser. No server or build step is required — everything runs client-side.

1. **Load CSV**: Click the upload area or drag & drop a CSV file
2. **Count Unique Users**: The app deduplicates users by their login name
3. **Apply Filters**: Enter repository names (one per line) in the "Repositories Filtered" textarea
4. **View Results**: The filtered user count updates based on your selection

## Example

Using the included `sample.csv`:
- **Total Unique Users**: 8 (john_doe, jane_smith, bob_jones, alice_williams, charlie_brown, david_miller, emily_davis)
- **Filter by `github/project-alpha`**: Shows only users who committed to that repository

## License

MIT