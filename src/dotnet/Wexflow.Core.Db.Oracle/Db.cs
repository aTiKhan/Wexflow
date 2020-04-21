﻿using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Wexflow.Core.Db.Oracle
{
    public class Db : Core.Db.Db
    {
        private static readonly string DateTimeFormat = "yyyy-MM-dd HH:mm:ss.fff";

        private readonly string _connectionString;
        private readonly Helper _helper;

        public Db(string connectionString) : base(connectionString)
        {
            _connectionString = connectionString;
            _helper = new Helper(connectionString);
            _helper.CreateTableIfNotExists(Core.Db.Entry.DocumentName, Entry.TableStruct);
            _helper.CreateTableIfNotExists(Core.Db.HistoryEntry.DocumentName, HistoryEntry.TableStruct);
            _helper.CreateTableIfNotExists(Core.Db.StatusCount.DocumentName, StatusCount.TableStruct);
            _helper.CreateTableIfNotExists(Core.Db.User.DocumentName, User.TableStruct);
            _helper.CreateTableIfNotExists(Core.Db.UserWorkflow.DocumentName, UserWorkflow.TableStruct);
            _helper.CreateTableIfNotExists(Core.Db.Workflow.DocumentName, Workflow.TableStruct);
        }

        public override void Init()
        {
            // StatusCount
            ClearStatusCount();

            var statusCount = new StatusCount
            {
                PendingCount = 0,
                RunningCount = 0,
                DoneCount = 0,
                FailedCount = 0,
                WarningCount = 0,
                DisabledCount = 0,
                StoppedCount = 0
            };

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("INSERT INTO " + Core.Db.StatusCount.DocumentName + "("
                    + StatusCount.ColumnName_PendingCount + ", "
                    + StatusCount.ColumnName_RunningCount + ", "
                    + StatusCount.ColumnName_DoneCount + ", "
                    + StatusCount.ColumnName_FailedCount + ", "
                    + StatusCount.ColumnName_WarningCount + ", "
                    + StatusCount.ColumnName_DisabledCount + ", "
                    + StatusCount.ColumnName_StoppedCount + ", "
                    + StatusCount.ColumnName_RejectedCount + ") VALUES("
                    + statusCount.PendingCount + ", "
                    + statusCount.RunningCount + ", "
                    + statusCount.DoneCount + ", "
                    + statusCount.FailedCount + ", "
                    + statusCount.WarningCount + ", "
                    + statusCount.DisabledCount + ", "
                    + statusCount.StoppedCount + ", "
                    + statusCount.RejectedCount + ")"
                    , conn))
                {
                    command.ExecuteNonQuery();
                }
            }

            // Entries
            ClearEntries();

            // Insert default user if necessary
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT COUNT(*) FROM " + Core.Db.User.DocumentName, conn))
                {
                    var usersCount = Convert.ToInt64((decimal)command.ExecuteScalar());

                    if (usersCount == 0)
                    {
                        InsertDefaultUser();
                    }
                }
            }
        }

        public override bool CheckUserWorkflow(string userId, string workflowId)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT COUNT(*) FROM " + Core.Db.UserWorkflow.DocumentName
                    + " WHERE " + UserWorkflow.ColumnName_UserId + "=" + int.Parse(userId)
                    + " AND " + UserWorkflow.ColumnName_WorkflowId + "=" + int.Parse(workflowId)
                    , conn))
                {
                    var count = Convert.ToInt64((decimal)command.ExecuteScalar());

                    return count > 0;
                }

            }
        }

        public override void ClearEntries()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("DELETE FROM " + Core.Db.Entry.DocumentName, conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void ClearStatusCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("DELETE FROM " + Core.Db.StatusCount.DocumentName, conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void DecrementPendingCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_PendingCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {
                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count--;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_PendingCount + " = " + count, conn))
                    {
                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void DecrementRunningCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_RunningCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {
                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count--;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_RunningCount + " = " + count, conn))
                    {
                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void DeleteUser(string username, string password)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("DELETE FROM " + Core.Db.User.DocumentName
                    + " WHERE " + User.ColumnName_Username + " = '" + username + "'"
                    + " AND " + User.ColumnName_Password + " = '" + password + "'"
                    , conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void DeleteUserWorkflowRelationsByUserId(string userId)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("DELETE FROM " + Core.Db.UserWorkflow.DocumentName
                    + " WHERE " + UserWorkflow.ColumnName_UserId + " = " + int.Parse(userId), conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void DeleteUserWorkflowRelationsByWorkflowId(string workflowDbId)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("DELETE FROM " + Core.Db.UserWorkflow.DocumentName
                    + " WHERE " + UserWorkflow.ColumnName_WorkflowId + " = " + int.Parse(workflowDbId), conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void DeleteWorkflow(string id)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("DELETE FROM " + Core.Db.Workflow.DocumentName
                    + " WHERE " + Workflow.ColumnName_Id + " = " + int.Parse(id), conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void DeleteWorkflows(string[] ids)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                var builder = new StringBuilder("(");

                for (int i = 0; i < ids.Length; i++)
                {
                    var id = ids[i];
                    builder.Append(id);
                    if (i < ids.Length - 1)
                    {
                        builder.Append(", ");
                    }
                    else
                    {
                        builder.Append(")");
                    }
                }

                using (var command = new OracleCommand("DELETE FROM " + Core.Db.Workflow.DocumentName
                    + " WHERE " + Workflow.ColumnName_Id + " IN " + builder.ToString(), conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override IEnumerable<Core.Db.User> GetAdministrators(string keyword, UserOrderBy uo)
        {
            List<User> admins = new List<User>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + User.ColumnName_Id + ", "
                    + User.ColumnName_Username + ", "
                    + User.ColumnName_Password + ", "
                    + User.ColumnName_Email + ", "
                    + User.ColumnName_UserProfile + ", "
                    + User.ColumnName_CreatedOn + ", "
                    + User.ColumnName_ModifiedOn
                    + " FROM " + Core.Db.User.DocumentName
                    + " WHERE " + "(LOWER(" + User.ColumnName_Username + ")" + " LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " AND " + User.ColumnName_UserProfile + " = " + (int)UserProfile.Administrator + ")"
                    + " ORDER BY " + User.ColumnName_Username + (uo == UserOrderBy.UsernameAscending ? " ASC" : " DESC")
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var admin = new User
                            {
                                Id = Convert.ToInt64((decimal)reader[User.ColumnName_Id]),
                                Username = (string)reader[User.ColumnName_Username],
                                Password = (string)reader[User.ColumnName_Password],
                                Email = reader[User.ColumnName_Email] == DBNull.Value ? string.Empty : (string)reader[User.ColumnName_Email],
                                UserProfile = (UserProfile)(Convert.ToInt32((decimal)reader[User.ColumnName_UserProfile])),
                                CreatedOn = (DateTime)reader[User.ColumnName_CreatedOn],
                                ModifiedOn = reader[User.ColumnName_ModifiedOn] == DBNull.Value ? DateTime.MinValue : (DateTime)reader[User.ColumnName_ModifiedOn]
                            };

                            admins.Add(admin);
                        }
                    }
                }
            }

            return admins;
        }

        public override IEnumerable<Core.Db.Entry> GetEntries()
        {
            List<Entry> entries = new List<Entry>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT "
                    + Entry.ColumnName_Id + ", "
                    + Entry.ColumnName_Name + ", "
                    + Entry.ColumnName_Description + ", "
                    + Entry.ColumnName_LaunchType + ", "
                    + Entry.ColumnName_Status + ", "
                    + Entry.ColumnName_StatusDate + ", "
                    + Entry.ColumnName_WorkflowId + ", "
                    + Entry.ColumnName_JobId
                    + " FROM " + Core.Db.Entry.DocumentName, conn))
                {
                    using (var reader = command.ExecuteReader())
                    {

                        while (reader.Read())
                        {
                            var entry = new Entry
                            {
                                Id = Convert.ToInt64((decimal)reader[Entry.ColumnName_Id]),
                                Name = reader[Entry.ColumnName_Name] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Name],
                                Description = reader[Entry.ColumnName_Description] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Description],
                                LaunchType = (LaunchType)(Convert.ToInt32((decimal)reader[Entry.ColumnName_LaunchType])),
                                Status = (Status)(Convert.ToInt32((decimal)reader[Entry.ColumnName_Status])),
                                StatusDate = (DateTime)reader[Entry.ColumnName_StatusDate],
                                WorkflowId = (Convert.ToInt32((decimal)reader[Entry.ColumnName_WorkflowId])),
                                JobId = reader[Entry.ColumnName_JobId] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_JobId]
                            };

                            entries.Add(entry);
                        }
                    }
                }
            }

            return entries;
        }

        public override IEnumerable<Core.Db.Entry> GetEntries(string keyword, DateTime from, DateTime to, int page, int entriesCount, EntryOrderBy eo)
        {
            List<Entry> entries = new List<Entry>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                var sqlBuilder = new StringBuilder("SELECT "
                    + Entry.ColumnName_Id + ", "
                    + Entry.ColumnName_Name + ", "
                    + Entry.ColumnName_Description + ", "
                    + Entry.ColumnName_LaunchType + ", "
                    + Entry.ColumnName_Status + ", "
                    + Entry.ColumnName_StatusDate + ", "
                    + Entry.ColumnName_WorkflowId + ", "
                    + Entry.ColumnName_JobId
                    + " FROM " + Core.Db.Entry.DocumentName
                    + " WHERE " + "(LOWER(" + Entry.ColumnName_Name + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " OR " + "LOWER(" + Entry.ColumnName_Description + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%')"
                    + " AND (" + Entry.ColumnName_StatusDate + " BETWEEN TO_TIMESTAMP('" + from.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF') AND TO_TIMESTAMP('" + to.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF'))"
                    + " ORDER BY ");

                switch (eo)
                {
                    case EntryOrderBy.StatusDateAscending:

                        sqlBuilder.Append(Entry.ColumnName_StatusDate).Append(" ASC");
                        break;

                    case EntryOrderBy.StatusDateDescending:

                        sqlBuilder.Append(Entry.ColumnName_StatusDate).Append(" DESC");
                        break;

                    case EntryOrderBy.WorkflowIdAscending:

                        sqlBuilder.Append(Entry.ColumnName_WorkflowId).Append(" ASC");
                        break;

                    case EntryOrderBy.WorkflowIdDescending:

                        sqlBuilder.Append(Entry.ColumnName_WorkflowId).Append(" DESC");
                        break;

                    case EntryOrderBy.NameAscending:

                        sqlBuilder.Append(Entry.ColumnName_Name).Append(" ASC");
                        break;

                    case EntryOrderBy.NameDescending:

                        sqlBuilder.Append(Entry.ColumnName_Name).Append(" DESC");
                        break;

                    case EntryOrderBy.LaunchTypeAscending:

                        sqlBuilder.Append(Entry.ColumnName_LaunchType).Append(" ASC");
                        break;

                    case EntryOrderBy.LaunchTypeDescending:

                        sqlBuilder.Append(Entry.ColumnName_LaunchType).Append(" DESC");
                        break;

                    case EntryOrderBy.DescriptionAscending:

                        sqlBuilder.Append(Entry.ColumnName_Description).Append(" ASC");
                        break;

                    case EntryOrderBy.DescriptionDescending:

                        sqlBuilder.Append(Entry.ColumnName_Description).Append(" DESC");
                        break;

                    case EntryOrderBy.StatusAscending:

                        sqlBuilder.Append(Entry.ColumnName_Status).Append(" ASC");
                        break;

                    case EntryOrderBy.StatusDescending:

                        sqlBuilder.Append(Entry.ColumnName_Status).Append(" DESC");
                        break;
                }

                sqlBuilder.Append(" OFFSET ").Append((page - 1) * entriesCount).Append(" ROWS FETCH NEXT ").Append(entriesCount).Append(" ROWS ONLY");

                using (var command = new OracleCommand(sqlBuilder.ToString(), conn))
                {

                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var entry = new Entry
                            {
                                Id = Convert.ToInt64((decimal)reader[Entry.ColumnName_Id]),
                                Name = reader[Entry.ColumnName_Name] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Name],
                                Description = reader[Entry.ColumnName_Description] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Description],
                                LaunchType = (LaunchType)(Convert.ToInt32((decimal)reader[Entry.ColumnName_LaunchType])),
                                Status = (Status)(Convert.ToInt32((decimal)reader[Entry.ColumnName_Status])),
                                StatusDate = (DateTime)reader[Entry.ColumnName_StatusDate],
                                WorkflowId = (Convert.ToInt32((decimal)reader[Entry.ColumnName_WorkflowId])),
                                JobId = reader[Entry.ColumnName_JobId] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_JobId]
                            };

                            entries.Add(entry);
                        }
                    }

                }
            }

            return entries;
        }

        public override long GetEntriesCount(string keyword, DateTime from, DateTime to)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT COUNT(*)"
                    + " FROM " + Core.Db.Entry.DocumentName
                    + " WHERE " + "(LOWER(" + Entry.ColumnName_Name + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " OR " + "LOWER(" + Entry.ColumnName_Description + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%')"
                    + " AND (" + Entry.ColumnName_StatusDate + " BETWEEN TO_TIMESTAMP('" + from.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF') AND TO_TIMESTAMP('" + to.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF'))", conn))
                {
                    var count = (decimal)command.ExecuteScalar();

                    return Convert.ToInt64(count);
                }
            }
        }

        public override Core.Db.Entry GetEntry(int workflowId)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT "
                    + Entry.ColumnName_Id + ", "
                    + Entry.ColumnName_Name + ", "
                    + Entry.ColumnName_Description + ", "
                    + Entry.ColumnName_LaunchType + ", "
                    + Entry.ColumnName_Status + ", "
                    + Entry.ColumnName_StatusDate + ", "
                    + Entry.ColumnName_WorkflowId + ", "
                    + Entry.ColumnName_JobId
                    + " FROM " + Core.Db.Entry.DocumentName
                    + " WHERE " + Entry.ColumnName_WorkflowId + " = " + workflowId, conn))
                {

                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var entry = new Entry
                            {
                                Id = Convert.ToInt64((decimal)reader[Entry.ColumnName_Id]),
                                Name = reader[Entry.ColumnName_Name] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Name],
                                Description = reader[Entry.ColumnName_Description] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Description],
                                LaunchType = (LaunchType)(Convert.ToInt32((decimal)reader[Entry.ColumnName_LaunchType])),
                                Status = (Status)(Convert.ToInt32((decimal)reader[Entry.ColumnName_Status])),
                                StatusDate = (DateTime)reader[Entry.ColumnName_StatusDate],
                                WorkflowId = (Convert.ToInt32((decimal)reader[Entry.ColumnName_WorkflowId])),
                                JobId = reader[Entry.ColumnName_JobId] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_JobId]
                            };

                            return entry;
                        }
                    }
                }

            }

            return null;
        }

        public override Core.Db.Entry GetEntry(int workflowId, Guid jobId)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT "
                    + Entry.ColumnName_Id + ", "
                    + Entry.ColumnName_Name + ", "
                    + Entry.ColumnName_Description + ", "
                    + Entry.ColumnName_LaunchType + ", "
                    + Entry.ColumnName_Status + ", "
                    + Entry.ColumnName_StatusDate + ", "
                    + Entry.ColumnName_WorkflowId + ", "
                    + Entry.ColumnName_JobId
                    + " FROM " + Core.Db.Entry.DocumentName
                    + " WHERE (" + Entry.ColumnName_WorkflowId + " = " + workflowId
                    + " AND " + Entry.ColumnName_JobId + " = '" + jobId.ToString() + "')", conn))
                {

                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var entry = new Entry
                            {
                                Id = Convert.ToInt64((decimal)reader[Entry.ColumnName_Id]),
                                Name = reader[Entry.ColumnName_Name] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Name],
                                Description = reader[Entry.ColumnName_Description] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Description],
                                LaunchType = (LaunchType)(Convert.ToInt32((decimal)reader[Entry.ColumnName_LaunchType])),
                                Status = (Status)(Convert.ToInt32((decimal)reader[Entry.ColumnName_Status])),
                                StatusDate = (DateTime)reader[Entry.ColumnName_StatusDate],
                                WorkflowId = (Convert.ToInt32((decimal)reader[Entry.ColumnName_WorkflowId])),
                                JobId = reader[Entry.ColumnName_JobId] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_JobId]
                            };

                            return entry;
                        }
                    }
                }

            }

            return null;
        }

        public override DateTime GetEntryStatusDateMax()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + Entry.ColumnName_StatusDate
                    + " FROM " + Core.Db.Entry.DocumentName
                    + " WHERE rownum = 1"
                    + " ORDER BY " + Entry.ColumnName_StatusDate + " DESC", conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var statusDate = (DateTime)reader[Entry.ColumnName_StatusDate];

                            return statusDate;
                        }
                    }
                }
            }

            return DateTime.Now;
        }

        public override DateTime GetEntryStatusDateMin()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + Entry.ColumnName_StatusDate
                    + " FROM " + Core.Db.Entry.DocumentName
                    + " WHERE rownum = 1"
                    + " ORDER BY " + Entry.ColumnName_StatusDate + " ASC", conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var statusDate = (DateTime)reader[Entry.ColumnName_StatusDate];

                            return statusDate;
                        }
                    }
                }
            }

            return DateTime.Now;
        }

        public override IEnumerable<Core.Db.HistoryEntry> GetHistoryEntries()
        {
            List<HistoryEntry> entries = new List<HistoryEntry>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT "
                    + HistoryEntry.ColumnName_Id + ", "
                    + HistoryEntry.ColumnName_Name + ", "
                    + HistoryEntry.ColumnName_Description + ", "
                    + HistoryEntry.ColumnName_LaunchType + ", "
                    + HistoryEntry.ColumnName_Status + ", "
                    + HistoryEntry.ColumnName_StatusDate + ", "
                    + HistoryEntry.ColumnName_WorkflowId
                    + " FROM " + Core.Db.HistoryEntry.DocumentName, conn))
                {

                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var entry = new HistoryEntry
                            {
                                Id = Convert.ToInt64((decimal)reader[HistoryEntry.ColumnName_Id]),
                                Name = reader[HistoryEntry.ColumnName_Name] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Name],
                                Description = reader[HistoryEntry.ColumnName_Description] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Description],
                                LaunchType = (LaunchType)(Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_LaunchType])),
                                Status = (Status)(Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_Status])),
                                StatusDate = (DateTime)reader[HistoryEntry.ColumnName_StatusDate],
                                WorkflowId = (Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_WorkflowId])),
                            };

                            entries.Add(entry);
                        }
                    }

                }
            }

            return entries;
        }

        public override IEnumerable<Core.Db.HistoryEntry> GetHistoryEntries(string keyword)
        {
            List<HistoryEntry> entries = new List<HistoryEntry>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT "
                    + HistoryEntry.ColumnName_Id + ", "
                    + HistoryEntry.ColumnName_Name + ", "
                    + HistoryEntry.ColumnName_Description + ", "
                    + HistoryEntry.ColumnName_LaunchType + ", "
                    + HistoryEntry.ColumnName_Status + ", "
                    + HistoryEntry.ColumnName_StatusDate + ", "
                    + HistoryEntry.ColumnName_WorkflowId
                    + " FROM " + Core.Db.HistoryEntry.DocumentName
                    + " WHERE " + "LOWER(" + HistoryEntry.ColumnName_Name + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " OR " + "LOWER(" + HistoryEntry.ColumnName_Description + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'", conn))
                {

                    using (var reader = command.ExecuteReader())
                    {

                        while (reader.Read())
                        {
                            var entry = new HistoryEntry
                            {
                                Id = Convert.ToInt64((decimal)reader[HistoryEntry.ColumnName_Id]),
                                Name = reader[HistoryEntry.ColumnName_Name] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Name],
                                Description = reader[HistoryEntry.ColumnName_Description] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Description],
                                LaunchType = (LaunchType)(Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_LaunchType])),
                                Status = (Status)(Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_Status])),
                                StatusDate = (DateTime)reader[HistoryEntry.ColumnName_StatusDate],
                                WorkflowId = (Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_WorkflowId])),
                            };

                            entries.Add(entry);
                        }
                    }

                }

            }

            return entries;
        }

        public override IEnumerable<Core.Db.HistoryEntry> GetHistoryEntries(string keyword, int page, int entriesCount)
        {
            List<HistoryEntry> entries = new List<HistoryEntry>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT "
                    + HistoryEntry.ColumnName_Id + ", "
                    + HistoryEntry.ColumnName_Name + ", "
                    + HistoryEntry.ColumnName_Description + ", "
                    + HistoryEntry.ColumnName_LaunchType + ", "
                    + HistoryEntry.ColumnName_Status + ", "
                    + HistoryEntry.ColumnName_StatusDate + ", "
                    + HistoryEntry.ColumnName_WorkflowId
                    + " FROM " + Core.Db.HistoryEntry.DocumentName
                    + " WHERE " + "LOWER(" + HistoryEntry.ColumnName_Name + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " OR " + "LOWER(" + HistoryEntry.ColumnName_Description + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " OFFSET " + (page - 1) * entriesCount + " ROWS FETCH NEXT " + entriesCount + " ROWS ONLY"
                    , conn))
                {

                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var entry = new HistoryEntry
                            {
                                Id = Convert.ToInt64((decimal)reader[HistoryEntry.ColumnName_Id]),
                                Name = reader[HistoryEntry.ColumnName_Name] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Name],
                                Description = reader[HistoryEntry.ColumnName_Description] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Description],
                                LaunchType = (LaunchType)(Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_LaunchType])),
                                Status = (Status)(Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_Status])),
                                StatusDate = (DateTime)reader[HistoryEntry.ColumnName_StatusDate],
                                WorkflowId = (Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_WorkflowId])),
                            };

                            entries.Add(entry);
                        }
                    }

                }
            }
            return entries;
        }

        public override IEnumerable<Core.Db.HistoryEntry> GetHistoryEntries(string keyword, DateTime from, DateTime to, int page, int entriesCount, EntryOrderBy heo)
        {
            List<HistoryEntry> entries = new List<HistoryEntry>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                var sqlBuilder = new StringBuilder("SELECT "
                    + HistoryEntry.ColumnName_Id + ", "
                    + HistoryEntry.ColumnName_Name + ", "
                    + HistoryEntry.ColumnName_Description + ", "
                    + HistoryEntry.ColumnName_LaunchType + ", "
                    + HistoryEntry.ColumnName_Status + ", "
                    + HistoryEntry.ColumnName_StatusDate + ", "
                    + HistoryEntry.ColumnName_WorkflowId
                    + " FROM " + Core.Db.HistoryEntry.DocumentName
                    + " WHERE " + "(LOWER(" + HistoryEntry.ColumnName_Name + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " OR " + "LOWER(" + HistoryEntry.ColumnName_Description + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%')"
                    + " AND (" + HistoryEntry.ColumnName_StatusDate + " BETWEEN TO_TIMESTAMP('" + from.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF') AND TO_TIMESTAMP('" + to.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF'))"
                    + " ORDER BY ");

                switch (heo)
                {
                    case EntryOrderBy.StatusDateAscending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_StatusDate).Append(" ASC");
                        break;

                    case EntryOrderBy.StatusDateDescending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_StatusDate).Append(" DESC");
                        break;

                    case EntryOrderBy.WorkflowIdAscending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_WorkflowId).Append(" ASC");
                        break;

                    case EntryOrderBy.WorkflowIdDescending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_WorkflowId).Append(" DESC");
                        break;

                    case EntryOrderBy.NameAscending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_Name).Append(" ASC");
                        break;

                    case EntryOrderBy.NameDescending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_Name).Append(" DESC");
                        break;

                    case EntryOrderBy.LaunchTypeAscending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_LaunchType).Append(" ASC");
                        break;

                    case EntryOrderBy.LaunchTypeDescending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_LaunchType).Append(" DESC");
                        break;

                    case EntryOrderBy.DescriptionAscending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_Description).Append(" ASC");
                        break;

                    case EntryOrderBy.DescriptionDescending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_Description).Append(" DESC");
                        break;

                    case EntryOrderBy.StatusAscending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_Status).Append(" ASC");
                        break;

                    case EntryOrderBy.StatusDescending:

                        sqlBuilder.Append(HistoryEntry.ColumnName_Status).Append(" DESC");
                        break;
                }

                sqlBuilder.Append(" OFFSET ").Append((page - 1) * entriesCount).Append(" ROWS FETCH NEXT ").Append(entriesCount).Append(" ROWS ONLY");

                using (var command = new OracleCommand(sqlBuilder.ToString(), conn))
                {

                    using (var reader = command.ExecuteReader())
                    {

                        while (reader.Read())
                        {
                            var entry = new HistoryEntry
                            {
                                Id = Convert.ToInt64((decimal)reader[HistoryEntry.ColumnName_Id]),
                                Name = reader[HistoryEntry.ColumnName_Name] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Name],
                                Description = reader[HistoryEntry.ColumnName_Description] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Description],
                                LaunchType = (LaunchType)(Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_LaunchType])),
                                Status = (Status)(Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_Status])),
                                StatusDate = (DateTime)reader[HistoryEntry.ColumnName_StatusDate],
                                WorkflowId = (Convert.ToInt32((decimal)reader[HistoryEntry.ColumnName_WorkflowId])),
                            };

                            entries.Add(entry);
                        }
                    }
                }
            }

            return entries;
        }

        public override long GetHistoryEntriesCount(string keyword)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT COUNT(*)"
                    + " FROM " + Core.Db.HistoryEntry.DocumentName
                    + " WHERE " + "LOWER(" + HistoryEntry.ColumnName_Name + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " OR " + "LOWER(" + HistoryEntry.ColumnName_Description + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'", conn))
                {
                    var count = (decimal)command.ExecuteScalar();

                    return Convert.ToInt64(count);
                }
            }
        }

        public override long GetHistoryEntriesCount(string keyword, DateTime from, DateTime to)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT COUNT(*)"
                    + " FROM " + Core.Db.HistoryEntry.DocumentName
                    + " WHERE " + "(LOWER(" + HistoryEntry.ColumnName_Name + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " OR " + "LOWER(" + HistoryEntry.ColumnName_Description + ") LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%')"
                    + " AND (" + HistoryEntry.ColumnName_StatusDate + " BETWEEN TO_TIMESTAMP('" + from.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF') AND TO_TIMESTAMP('" + to.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF'))", conn))
                {
                    var count = (decimal)command.ExecuteScalar();

                    return Convert.ToInt64(count);
                }
            }
        }

        public override DateTime GetHistoryEntryStatusDateMax()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + HistoryEntry.ColumnName_StatusDate
                    + " FROM " + Core.Db.HistoryEntry.DocumentName
                    + " WHERE rownum = 1"
                    + " ORDER BY " + HistoryEntry.ColumnName_StatusDate + " DESC", conn))
                {

                    using (var reader = command.ExecuteReader())
                    {

                        if (reader.Read())
                        {
                            var statusDate = (DateTime)reader[HistoryEntry.ColumnName_StatusDate];

                            return statusDate;
                        }
                    }
                }
            }

            return DateTime.Now;
        }

        public override DateTime GetHistoryEntryStatusDateMin()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + HistoryEntry.ColumnName_StatusDate
                    + " FROM " + Core.Db.HistoryEntry.DocumentName
                    + " WHERE rownum = 1"
                    + " ORDER BY " + HistoryEntry.ColumnName_StatusDate + " ASC", conn))
                {

                    using (var reader = command.ExecuteReader())
                    {

                        if (reader.Read())
                        {
                            var statusDate = (DateTime)reader[HistoryEntry.ColumnName_StatusDate];

                            return statusDate;
                        }
                    }
                }
            }

            return DateTime.Now;
        }

        public override string GetPassword(string username)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + User.ColumnName_Password
                    + " FROM " + Core.Db.User.DocumentName
                    + " WHERE " + User.ColumnName_Username + " = '" + (username ?? "").Replace("'", "''") + "'"
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var password = (string)reader[User.ColumnName_Password];

                            return password;
                        }
                    }
                }
            }

            return null;
        }

        public override Core.Db.StatusCount GetStatusCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + StatusCount.ColumnName_Id + ", "
                    + StatusCount.ColumnName_PendingCount + ", "
                    + StatusCount.ColumnName_RunningCount + ", "
                    + StatusCount.ColumnName_DoneCount + ", "
                    + StatusCount.ColumnName_FailedCount + ", "
                    + StatusCount.ColumnName_WarningCount + ", "
                    + StatusCount.ColumnName_DisabledCount + ", "
                    + StatusCount.ColumnName_StoppedCount + ", "
                    + StatusCount.ColumnName_RejectedCount
                    + " FROM " + Core.Db.StatusCount.DocumentName
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var statusCount = new StatusCount
                            {
                                Id = Convert.ToInt64((decimal)reader[StatusCount.ColumnName_Id]),
                                PendingCount = Convert.ToInt32((decimal)reader[StatusCount.ColumnName_PendingCount]),
                                RunningCount = Convert.ToInt32(reader[StatusCount.ColumnName_RunningCount]),
                                DoneCount = Convert.ToInt32(reader[StatusCount.ColumnName_DoneCount]),
                                FailedCount = Convert.ToInt32(reader[StatusCount.ColumnName_FailedCount]),
                                WarningCount = Convert.ToInt32(reader[StatusCount.ColumnName_WarningCount]),
                                DisabledCount = Convert.ToInt32(reader[StatusCount.ColumnName_DisabledCount]),
                                StoppedCount = Convert.ToInt32(reader[StatusCount.ColumnName_StoppedCount]),
                                RejectedCount = Convert.ToInt32(reader[StatusCount.ColumnName_RejectedCount])
                            };

                            return statusCount;
                        }
                    }
                }
            }

            return null;
        }

        public override Core.Db.User GetUser(string username)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + User.ColumnName_Id + ", "
                    + User.ColumnName_Username + ", "
                    + User.ColumnName_Password + ", "
                    + User.ColumnName_Email + ", "
                    + User.ColumnName_UserProfile + ", "
                    + User.ColumnName_CreatedOn + ", "
                    + User.ColumnName_ModifiedOn
                    + " FROM " + Core.Db.User.DocumentName
                    + " WHERE " + User.ColumnName_Username + " = '" + (username ?? "").Replace("'", "''") + "'"
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var user = new User
                            {
                                Id = Convert.ToInt64((decimal)reader[User.ColumnName_Id]),
                                Username = (string)reader[User.ColumnName_Username],
                                Password = (string)reader[User.ColumnName_Password],
                                Email = reader[User.ColumnName_Email] == DBNull.Value ? string.Empty : (string)reader[User.ColumnName_Email],
                                UserProfile = (UserProfile)(Convert.ToInt32((decimal)reader[User.ColumnName_UserProfile])),
                                CreatedOn = (DateTime)reader[User.ColumnName_CreatedOn],
                                ModifiedOn = reader[User.ColumnName_ModifiedOn] == DBNull.Value ? DateTime.MinValue : (DateTime)reader[User.ColumnName_ModifiedOn]
                            };

                            return user;
                        }
                    }
                }
            }

            return null;
        }

        public override Core.Db.User GetUserByUserId(string userId)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + User.ColumnName_Id + ", "
                    + User.ColumnName_Username + ", "
                    + User.ColumnName_Password + ", "
                    + User.ColumnName_Email + ", "
                    + User.ColumnName_UserProfile + ", "
                    + User.ColumnName_CreatedOn + ", "
                    + User.ColumnName_ModifiedOn
                    + " FROM " + Core.Db.User.DocumentName
                    + " WHERE " + User.ColumnName_Id + " = '" + int.Parse(userId) + "'"
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {

                        if (reader.Read())
                        {
                            var user = new User
                            {
                                Id = Convert.ToInt64((decimal)reader[User.ColumnName_Id]),
                                Username = (string)reader[User.ColumnName_Username],
                                Password = (string)reader[User.ColumnName_Password],
                                Email = reader[User.ColumnName_Email] == DBNull.Value ? string.Empty : (string)reader[User.ColumnName_Email],
                                UserProfile = (UserProfile)(Convert.ToInt32((decimal)reader[User.ColumnName_UserProfile])),
                                CreatedOn = (DateTime)reader[User.ColumnName_CreatedOn],
                                ModifiedOn = reader[User.ColumnName_ModifiedOn] == DBNull.Value ? DateTime.MinValue : (DateTime)reader[User.ColumnName_ModifiedOn]
                            };

                            return user;
                        }
                    }
                }
            }

            return null;
        }

        public override IEnumerable<Core.Db.User> GetUsers()
        {
            List<User> users = new List<User>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + User.ColumnName_Id + ", "
                    + User.ColumnName_Username + ", "
                    + User.ColumnName_Password + ", "
                    + User.ColumnName_Email + ", "
                    + User.ColumnName_UserProfile + ", "
                    + User.ColumnName_CreatedOn + ", "
                    + User.ColumnName_ModifiedOn
                    + " FROM " + Core.Db.User.DocumentName
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {

                        while (reader.Read())
                        {
                            var user = new User
                            {
                                Id = Convert.ToInt64((decimal)reader[User.ColumnName_Id]),
                                Username = (string)reader[User.ColumnName_Username],
                                Password = (string)reader[User.ColumnName_Password],
                                Email = reader[User.ColumnName_Email] == DBNull.Value ? string.Empty : (string)reader[User.ColumnName_Email],
                                UserProfile = (UserProfile)(Convert.ToInt32((decimal)reader[User.ColumnName_UserProfile])),
                                CreatedOn = (DateTime)reader[User.ColumnName_CreatedOn],
                                ModifiedOn = reader[User.ColumnName_ModifiedOn] == DBNull.Value ? DateTime.MinValue : (DateTime)reader[User.ColumnName_ModifiedOn]
                            };

                            users.Add(user);
                        }
                    }
                }
            }

            return users;
        }

        public override IEnumerable<Core.Db.User> GetUsers(string keyword, UserOrderBy uo)
        {
            List<User> users = new List<User>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + User.ColumnName_Id + ", "
                    + User.ColumnName_Username + ", "
                    + User.ColumnName_Password + ", "
                    + User.ColumnName_Email + ", "
                    + User.ColumnName_UserProfile + ", "
                    + User.ColumnName_CreatedOn + ", "
                    + User.ColumnName_ModifiedOn
                    + " FROM " + Core.Db.User.DocumentName
                    + " WHERE " + "LOWER(" + User.ColumnName_Username + ")" + " LIKE '%" + (keyword ?? "").Replace("'", "''").ToLower() + "%'"
                    + " ORDER BY " + User.ColumnName_Username + (uo == UserOrderBy.UsernameAscending ? " ASC" : " DESC")
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {

                        while (reader.Read())
                        {
                            var user = new User
                            {
                                Id = Convert.ToInt64((decimal)reader[User.ColumnName_Id]),
                                Username = (string)reader[User.ColumnName_Username],
                                Password = (string)reader[User.ColumnName_Password],
                                Email = reader[User.ColumnName_Email] == DBNull.Value ? string.Empty : (string)reader[User.ColumnName_Email],
                                UserProfile = (UserProfile)(Convert.ToInt32((decimal)reader[User.ColumnName_UserProfile])),
                                CreatedOn = (DateTime)reader[User.ColumnName_CreatedOn],
                                ModifiedOn = reader[User.ColumnName_ModifiedOn] == DBNull.Value ? DateTime.MinValue : (DateTime)reader[User.ColumnName_ModifiedOn]
                            };

                            users.Add(user);
                        }
                    }
                }
            }

            return users;
        }

        public override IEnumerable<string> GetUserWorkflows(string userId)
        {
            List<string> workflowIds = new List<string>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + UserWorkflow.ColumnName_Id + ", "
                    + UserWorkflow.ColumnName_UserId + ", "
                    + UserWorkflow.ColumnName_WorkflowId
                    + " FROM " + Core.Db.UserWorkflow.DocumentName
                    + " WHERE " + UserWorkflow.ColumnName_UserId + " = " + int.Parse(userId)
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var workflowId = Convert.ToInt64((decimal)reader[UserWorkflow.ColumnName_WorkflowId]);

                            workflowIds.Add(workflowId.ToString());
                        }
                    }
                }
            }

            return workflowIds;
        }

        public override Core.Db.Workflow GetWorkflow(string id)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + Workflow.ColumnName_Id + ", "
                    + Workflow.ColumnName_Xml
                    + " FROM " + Core.Db.Workflow.DocumentName
                    + " WHERE " + Workflow.ColumnName_Id + " = " + int.Parse(id), conn))
                {
                    using (var reader = command.ExecuteReader())
                    {

                        if (reader.Read())
                        {
                            var workflow = new Workflow
                            {
                                Id = Convert.ToInt64((decimal)reader[Workflow.ColumnName_Id]),
                                Xml = (string)reader[Workflow.ColumnName_Xml]
                            };

                            return workflow;
                        }
                    }
                }
            }

            return null;
        }

        public override IEnumerable<Core.Db.Workflow> GetWorkflows()
        {
            List<Core.Db.Workflow> workflows = new List<Core.Db.Workflow>();

            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + Workflow.ColumnName_Id + ", "
                    + Workflow.ColumnName_Xml
                    + " FROM " + Core.Db.Workflow.DocumentName, conn))
                {
                    using (var reader = command.ExecuteReader())
                    {

                        while (reader.Read())
                        {
                            var workflow = new Workflow
                            {
                                Id = Convert.ToInt64((decimal)reader[Workflow.ColumnName_Id]),
                                Xml = (string)reader[Workflow.ColumnName_Xml]
                            };

                            workflows.Add(workflow);
                        }
                    }
                }
            }

            return workflows;
        }

        public override void IncrementDisabledCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_DisabledCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {
                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count++;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_DisabledCount + " = " + count, conn))
                    {
                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void IncrementRejectedCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_RejectedCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {
                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count++;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_RejectedCount + " = " + count, conn))
                    {

                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void IncrementDoneCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_DoneCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {
                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count++;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_DoneCount + " = " + count, conn))
                    {

                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void IncrementFailedCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_FailedCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {

                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count++;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_FailedCount + " = " + count, conn))
                    {
                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void IncrementPendingCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_PendingCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {

                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count++;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_PendingCount + " = " + count, conn))
                    {

                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void IncrementRunningCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_RunningCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {

                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count++;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_RunningCount + " = " + count, conn))
                    {

                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void IncrementStoppedCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_StoppedCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {

                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count++;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_StoppedCount + " = " + count, conn))
                    {

                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void IncrementWarningCount()
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command1 = new OracleCommand("SELECT " + StatusCount.ColumnName_WarningCount + " FROM " + Core.Db.StatusCount.DocumentName, conn))
                {

                    var count = Convert.ToInt32((decimal)command1.ExecuteScalar());

                    count++;

                    using (var command2 = new OracleCommand("UPDATE " + Core.Db.StatusCount.DocumentName + " SET " + StatusCount.ColumnName_WarningCount + " = " + count, conn))
                    {

                        command2.ExecuteNonQuery();
                    }
                }
            }
        }

        public override void InsertEntry(Core.Db.Entry entry)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("INSERT INTO " + Core.Db.Entry.DocumentName + "("
                    + Entry.ColumnName_Name + ", "
                    + Entry.ColumnName_Description + ", "
                    + Entry.ColumnName_LaunchType + ", "
                    + Entry.ColumnName_StatusDate + ", "
                    + Entry.ColumnName_Status + ", "
                    + Entry.ColumnName_WorkflowId + ", "
                    + Entry.ColumnName_JobId + ", "
                    + Entry.ColumnName_Logs + ") VALUES("
                    + "'" + (entry.Name ?? "").Replace("'", "''") + "'" + ", "
                    + "'" + (entry.Description ?? "").Replace("'", "''") + "'" + ", "
                    + (int)entry.LaunchType + ", "
                    + "TO_TIMESTAMP('" + entry.StatusDate.ToString(DateTimeFormat) + "'" + ", 'YYYY-MM-DD HH24:MI:SS.FF'), "
                    + (int)entry.Status + ", "
                    + entry.WorkflowId + ", "
                    + "'" + (entry.JobId ?? "") + "', "
                    + "'" + (entry.Logs ?? "").Replace("'", "''") + "'" + ")"
                    , conn))
                {

                    command.ExecuteNonQuery();
                }
            }
        }

        public override void InsertHistoryEntry(Core.Db.HistoryEntry entry)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("INSERT INTO " + Core.Db.HistoryEntry.DocumentName + "("
                    + HistoryEntry.ColumnName_Name + ", "
                    + HistoryEntry.ColumnName_Description + ", "
                    + HistoryEntry.ColumnName_LaunchType + ", "
                    + HistoryEntry.ColumnName_StatusDate + ", "
                    + HistoryEntry.ColumnName_Status + ", "
                    + HistoryEntry.ColumnName_WorkflowId + ", "
                    + HistoryEntry.ColumnName_Logs + ") VALUES("
                    + "'" + (entry.Name ?? "").Replace("'", "''") + "'" + ", "
                    + "'" + (entry.Description ?? "").Replace("'", "''") + "'" + ", "
                    + (int)entry.LaunchType + ", "
                    + "TO_TIMESTAMP('" + entry.StatusDate.ToString(DateTimeFormat) + "'" + ", 'YYYY-MM-DD HH24:MI:SS.FF'), "
                    + (int)entry.Status + ", "
                    + entry.WorkflowId + ", "
                    + "'" + (entry.Logs ?? "").Replace("'", "''") + "'" + ")"
                    , conn))
                {

                    command.ExecuteNonQuery();
                }
            }
        }

        public override void InsertUser(Core.Db.User user)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("INSERT INTO " + Core.Db.User.DocumentName + "("
                    + User.ColumnName_Username + ", "
                    + User.ColumnName_Password + ", "
                    + User.ColumnName_UserProfile + ", "
                    + User.ColumnName_Email + ", "
                    + User.ColumnName_CreatedOn + ", "
                    + User.ColumnName_ModifiedOn + ") VALUES("
                    + "'" + (user.Username ?? "").Replace("'", "''") + "'" + ", "
                    + "'" + (user.Password ?? "").Replace("'", "''") + "'" + ", "
                    + (int)user.UserProfile + ", "
                    + "'" + (user.Email ?? "").Replace("'", "''") + "'" + ", "
                    + "TO_TIMESTAMP(" + "'" + DateTime.Now.ToString(DateTimeFormat) + "'" + ", 'YYYY-MM-DD HH24:MI:SS.FF')" + ", "
                    + (user.ModifiedOn == DateTime.MinValue ? "NULL" : ("TO_TIMESTAMP(" + "'" + user.ModifiedOn.ToString(DateTimeFormat) + "'" + ", 'YYYY-MM-DD HH24:MI:SS.FF')")) + ")"
                    , conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void InsertUserWorkflowRelation(Core.Db.UserWorkflow userWorkflow)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("INSERT INTO " + Core.Db.UserWorkflow.DocumentName + "("
                    + UserWorkflow.ColumnName_UserId + ", "
                    + UserWorkflow.ColumnName_WorkflowId + ") VALUES("
                    + int.Parse(userWorkflow.UserId) + ", "
                    + int.Parse(userWorkflow.WorkflowId) + ")"
                    , conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        private IEnumerable<string> ToChuncks(string str, int maxChunkSize)
        {
            for (int i = 0; i < str.Length; i += maxChunkSize)
            {
                yield return str.Substring(i, Math.Min(maxChunkSize, str.Length - i));
            }
        }

        private string ToCLOB(Core.Db.Workflow workflow)
        {
            var xml = (workflow.Xml ?? "").Replace("'", "''");
            var chunkSize = 4000;
            var builder = new StringBuilder();
            var chunks = ToChuncks(xml, chunkSize).ToArray();

            for (var i = 0; i < chunks.Length; i++)
            {
                var chunk = chunks[i];
                builder.Append("TO_CLOB(").Append("'").Append(chunk).Append("')");
                if (i < chunks.Length - 1)
                {
                    builder.Append(" || ");
                }
            }

            var xmlVal = builder.ToString();

            return xmlVal;
        }

        public override string InsertWorkflow(Core.Db.Workflow workflow)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();
                var xml = ToCLOB(workflow);

                using (var command = new OracleCommand("INSERT INTO " + Core.Db.Workflow.DocumentName + "("
                    + Workflow.ColumnName_Xml + ") VALUES("
                    + xml + ") RETURNING " + Workflow.ColumnName_Id + " INTO :id"
                    , conn))
                {
                    command.Parameters.Add(new OracleParameter
                    {
                        ParameterName = ":id",
                        DbType = System.Data.DbType.Decimal,
                        Direction = System.Data.ParameterDirection.Output
                    });

                    command.ExecuteNonQuery();

                    var id = Convert.ToInt64(command.Parameters[":id"].Value).ToString();

                    return id.ToString();
                }
            }
        }

        public override void UpdateEntry(string id, Core.Db.Entry entry)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("UPDATE " + Core.Db.Entry.DocumentName + " SET "
                    + Entry.ColumnName_Name + " = '" + (entry.Name ?? "").Replace("'", "''") + "', "
                    + Entry.ColumnName_Description + " = '" + (entry.Description ?? "").Replace("'", "''") + "', "
                    + Entry.ColumnName_LaunchType + " = " + (int)entry.LaunchType + ", "
                    + Entry.ColumnName_StatusDate + " = TO_TIMESTAMP('" + entry.StatusDate.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF'), "
                    + Entry.ColumnName_Status + " = " + (int)entry.Status + ", "
                    + Entry.ColumnName_WorkflowId + " = " + entry.WorkflowId + ", "
                    + Entry.ColumnName_JobId + " = '" + (entry.JobId ?? "") + "', "
                    + Entry.ColumnName_Logs + " = '" + (entry.Logs ?? "").Replace("'", "''") + "'"
                    + " WHERE "
                    + Entry.ColumnName_Id + " = " + int.Parse(id)
                    , conn))
                {

                    command.ExecuteNonQuery();
                }
            }
        }

        public override void UpdatePassword(string username, string password)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("UPDATE " + Core.Db.User.DocumentName + " SET "
                    + User.ColumnName_Password + " = '" + (password ?? "").Replace("'", "''") + "'"
                    + " WHERE "
                    + User.ColumnName_Username + " = '" + (username ?? "").Replace("'", "''") + "'"
                    , conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void UpdateUser(string id, Core.Db.User user)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("UPDATE " + Core.Db.User.DocumentName + " SET "
                    + User.ColumnName_Username + " = '" + (user.Username ?? "").Replace("'", "''") + "', "
                    + User.ColumnName_Password + " = '" + (user.Password ?? "").Replace("'", "''") + "', "
                    + User.ColumnName_UserProfile + " = " + (int)user.UserProfile + ", "
                    + User.ColumnName_Email + " = '" + (user.Email ?? "").Replace("'", "''") + "', "
                    + User.ColumnName_CreatedOn + " = TO_TIMESTAMP('" + user.CreatedOn.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF')" + ", "
                    + User.ColumnName_ModifiedOn + " = TO_TIMESTAMP('" + DateTime.Now.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF')"
                    + " WHERE "
                    + User.ColumnName_Id + " = " + int.Parse(id)
                    , conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void UpdateUsernameAndEmailAndUserProfile(string userId, string username, string email, UserProfile up)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("UPDATE " + Core.Db.User.DocumentName + " SET "
                    + User.ColumnName_Username + " = '" + (username ?? "").Replace("'", "''") + "', "
                    + User.ColumnName_UserProfile + " = " + (int)up + ", "
                    + User.ColumnName_Email + " = '" + (email ?? "").Replace("'", "''") + "', "
                    + User.ColumnName_ModifiedOn + " = TO_TIMESTAMP('" + DateTime.Now.ToString(DateTimeFormat) + "', 'YYYY-MM-DD HH24:MI:SS.FF')"
                    + " WHERE "
                    + User.ColumnName_Id + " = " + int.Parse(userId)
                    , conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override void UpdateWorkflow(string dbId, Core.Db.Workflow workflow)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                var xml = ToCLOB(workflow);

                using (var command = new OracleCommand("UPDATE " + Core.Db.Workflow.DocumentName + " SET "
                    + Workflow.ColumnName_Xml + " = " + xml
                    + " WHERE "
                    + User.ColumnName_Id + " = " + int.Parse(dbId)
                    , conn))
                {
                    command.ExecuteNonQuery();
                }
            }
        }

        public override string GetEntryLogs(string entryId)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + Entry.ColumnName_Logs
                    + " FROM " + Core.Db.Entry.DocumentName
                    + " WHERE "
                    + Entry.ColumnName_Id + " = " + int.Parse(entryId)
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var logs = reader[Entry.ColumnName_Logs] == DBNull.Value ? string.Empty : (string)reader[Entry.ColumnName_Logs];
                            return logs;
                        }
                    }
                }

            }

            return null;
        }

        public override string GetHistoryEntryLogs(string entryId)
        {
            using (var conn = new OracleConnection(_connectionString))
            {
                conn.Open();

                using (var command = new OracleCommand("SELECT " + HistoryEntry.ColumnName_Logs
                    + " FROM " + Core.Db.HistoryEntry.DocumentName
                    + " WHERE "
                    + HistoryEntry.ColumnName_Id + " = " + int.Parse(entryId)
                    , conn))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var logs = reader[Entry.ColumnName_Logs] == DBNull.Value ? string.Empty : (string)reader[HistoryEntry.ColumnName_Logs];
                            return logs;
                        }
                    }
                }

            }

            return null;
        }

        public override void Dispose()
        {
        }

    }
}
