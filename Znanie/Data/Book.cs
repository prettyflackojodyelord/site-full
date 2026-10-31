namespace Znanie.Data;

public class Book
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Author { get; set; } = "";
    public string Genre { get; set; } = "";
    public string GenreLabel { get; set; } = "";
    public int Year { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public double Rating { get; set; }
    public int Pages { get; set; }
    public string CoverType { get; set; } = "";
    public string Format { get; set; } = "";
    public string? Cover { get; set; }
    public string? Badge { get; set; }
    public string Description { get; set; } = "";
    public string[]? Palette { get; set; }
}
