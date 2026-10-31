using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Znanie.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorPages();
var databasePath = Path.Combine(builder.Environment.ContentRootPath, "znanie.db");
builder.Services.AddDbContext<StoreDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));

var app = builder.Build();

// Создаём базу и добавляем исходные книги только при первом запуске.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<StoreDbContext>();
    var created = await db.Database.EnsureCreatedAsync();
    if (created)
    {
        var path = Path.Combine(app.Environment.ContentRootPath, "Data", "books.json");
        await using var file = File.OpenRead(path);
        var initialBooks = await JsonSerializer.DeserializeAsync<List<Book>>(file,
            new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];
        db.Books.AddRange(initialBooks);
        await db.SaveChangesAsync();
    }
}

if (args.Contains("--initialize-db")) return;

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapGet("/api/books", async (StoreDbContext db) =>
    await db.Books.AsNoTracking().OrderBy(book => book.Title).ToListAsync());
app.MapGet("/api/books/{id}", async (string id, StoreDbContext db) =>
    await db.Books.AsNoTracking().FirstOrDefaultAsync(book => book.Id == id)
        is { } book ? Results.Ok(book) : Results.NotFound());

// Существующий интерфейс получает данные из SQLite, сохраняя свою вёрстку и логику.
app.MapGet("/api/catalog.js", async (StoreDbContext db, HttpContext context) =>
{
    var books = await db.Books.AsNoTracking().ToListAsync();
    var genres = await File.ReadAllTextAsync(Path.Combine(app.Environment.ContentRootPath, "Data", "genres.json"));
    var json = JsonSerializer.Serialize(books, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    context.Response.Headers.CacheControl = "no-store";
    return Results.Content($"window.BOOKS = {json};\nwindow.GENRES = {genres};", "application/javascript; charset=utf-8");
});
app.MapRazorPages();
app.Run();
