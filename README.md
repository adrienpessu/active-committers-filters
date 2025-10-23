# active-commiters-filters

A Golang web application for analyzing active committers from CSV data. This tool helps you count unique users and filter them by repository.

## Features

- **CSV File Import**: Load user commit data from CSV files
- **User Deduplication**: Automatically counts unique users (same login = same user)
- **Repository Filtering**: Filter users by specific repositories using a textarea
- **Real-time Statistics**: View total users and filtered user counts
- **Clean UI**: Modern, responsive interface built with Go templates

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

## Installation & Building

### Option 1: Run from Source
1. Make sure you have Go installed (1.16 or later)
2. Clone this repository:
   ```bash
   git clone https://github.com/adrienpessu/active-commiters-filters.git
   cd active-commiters-filters
   ```
3. Run directly:
   ```bash
   go run main.go sample.csv
   ```

### Option 2: Build Self-Contained Executable
Build a single executable that includes all templates (no external files needed):

```bash
# Build for your current platform
go build -o active-commiters-filters .

# Or use the build script for multiple platforms
./build.sh
```

The `build.sh` script creates binaries for:
- Windows (amd64)
- macOS (Intel & Apple Silicon)
- Linux (amd64 & arm64)

All binaries are **completely self-contained** - you only need to share the executable file!

### Option 3: Download from Releases
Download pre-built binaries from the [GitHub Releases](../../releases) page.

## Usage

Run the application with a CSV file as parameter:

```bash
# If running from source
go run main.go sample.csv

# If using built executable
./active-commiters-filters sample.csv

# Or using platform-specific binary from build script
./build/active-commiters-filters-darwin-arm64 sample.csv
```

The server will start on `http://localhost:8080`

**Note**: The executable is completely self-contained. You can copy just the binary file to any machine and run it - no need to install Go or copy template files!

## How It Works

1. **Load CSV**: The application reads the CSV file and loads all user records
2. **Count Unique Users**: It deduplicates users by their login name
3. **Apply Filters**: Enter repository names (one per line) in the "Repositories Filtered" textarea
4. **View Results**: The filtered user count updates based on your selection

## Example

Using the included `sample.csv`:
- **Total Unique Users**: 8 (john_doe, jane_smith, bob_jones, alice_williams, charlie_brown, david_miller, emily_davis)
- **Filter by `github/project-alpha`**: Shows only users who committed to that repository

## Development

### Local Development
```bash
# Run from source for development
go run main.go sample.csv
```

### Building
```bash
# Build for current platform
go build -o active-commiters-filters .

# Build for all platforms
./build.sh
```

### Key Features
- **Embedded Templates**: HTML templates are embedded in the binary using Go's `embed` package
- **Self-Contained**: No external dependencies or template files needed
- **Cross-Platform**: Build for Windows, macOS, and Linux from any platform
- **GitHub Actions**: Automatic builds and releases when you create a GitHub release

## License

MIT