namespace Wexflow.Core.Db.RavenDB
{
    public class User : Core.Db.User
    {
        public string Id { get; set; }

        public override string GetId()
        {
            return Id;
        }
    }
}
