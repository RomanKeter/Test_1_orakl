import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import bot


class StorageTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "test.sqlite3"
        self.path_patcher = patch.object(bot, "DATABASE_PATH", self.database_path)
        self.path_patcher.start()
        bot.init_db()

    def tearDown(self):
        self.path_patcher.stop()
        self.temp_dir.cleanup()

    def test_users_have_separate_message_histories(self):
        bot.ensure_user(101, "Alice")
        bot.ensure_user(202, "Bob")
        bot.save_message(101, "user", "Hello from Alice")
        bot.save_message(101, "assistant", "Hello, Alice")
        bot.save_message(202, "user", "Hello from Bob")

        self.assertEqual(
            bot.get_recent_messages(101),
            [
                {"role": "user", "content": "Hello from Alice"},
                {"role": "assistant", "content": "Hello, Alice"},
            ],
        )
        self.assertEqual(
            bot.get_recent_messages(202),
            [{"role": "user", "content": "Hello from Bob"}],
        )

    def test_persona_and_rules_are_included_in_instructions(self):
        bot.ensure_user(303, "Casey")
        with bot.db_connection() as db:
            db.execute(
                "UPDATE users SET persona = ? WHERE telegram_id = ?",
                ("Будь кратким и критичным.", 303),
            )
            db.execute(
                "INSERT INTO rules (telegram_id, rule) VALUES (?, ?)",
                (303, "Проверяй факты перед выводом."),
            )

        instructions = bot.build_instructions(303)
        self.assertIn("Будь кратким и критичным.", instructions)
        self.assertIn("Проверяй факты перед выводом.", instructions)

    def test_last_assistant_answer_is_retrieved(self):
        bot.ensure_user(404, "Taylor")
        bot.save_message(404, "assistant", "Первый ответ")
        bot.save_message(404, "user", "Уточнение")
        bot.save_message(404, "assistant", "Последний ответ")

        self.assertEqual(bot.get_last_assistant_answer(404), "Последний ответ")

    def test_forgetting_user_data_can_be_done_with_database_operations(self):
        bot.ensure_user(505, "Morgan")
        bot.save_message(505, "user", "Удаляемая переписка")
        with bot.db_connection() as db:
            db.execute("INSERT INTO rules (telegram_id, rule) VALUES (?, ?)", (505, "Правило"))
            db.execute("DELETE FROM messages WHERE telegram_id = ?", (505,))
            db.execute("DELETE FROM rules WHERE telegram_id = ?", (505,))
            db.execute("DELETE FROM users WHERE telegram_id = ?", (505,))

        self.assertEqual(bot.get_recent_messages(505), [])
        self.assertIsNone(bot.get_user_settings(505))


if __name__ == "__main__":
    unittest.main()
