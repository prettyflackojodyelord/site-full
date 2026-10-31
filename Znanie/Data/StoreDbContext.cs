using Microsoft.EntityFrameworkCore;

namespace Znanie.Data;

public class StoreDbContext(DbContextOptions<StoreDbContext> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();
}
