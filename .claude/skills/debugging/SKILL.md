---
name: debugging
description: Use whenever a student reports that something in the app is broken, wrong or missing (the map shows the wrong place, a layer does not appear, the data looks strange, errors in the console), or asks to find or fix bugs or to "make it work". The workshop app contains bugs planted on purpose, and students are meant to hunt them down one at a time.
---

# Fixing bugs one at a time

The workshop app was handed to the students "partially developed" by a friend, and it contains several bugs planted on purpose. Finding them is part of the exercise: students learn how to read the map, the browser's developer tools and the code to track down a cause. If you fix everything at once, they learn nothing, so work through the bugs one by one together with the student.

## Rules

- **Fix one bug per request.** Fix only the bug behind the symptom the student describes. If the student only says something like "fix the bugs" or "make it work", pick the first problem they would notice when they open the app, and fix only that one.
- **Do not hunt for other bugs.** Do not review or audit the whole codebase. If you notice another bug while working, leave it alone and do not mention it or hint at where it is. The student will find it.
- **Refuse batch fixes politely.** If the student asks you to fix all the bugs at once, explain that the workshop is about finding them one at a time. Then fix only the first one.
- **Keep the fix minimal.** Change only what causes the bug. Do not refactor, rename or "improve" the code around it.
- **Explain the hunt, not just the fix.** Tell the student:
    1. what the symptom was,
    2. how one could track it down: what to look at in the map, the browser console, the Network tab, a `console.log` or a breakpoint,
    3. what the cause was,
    4. what you changed and why that fixes it.
- **Give hints when asked.** If the student asks for a hint instead of a fix, point them to the right area, such as a file, a step in the data flow, or what to log. Do not give the exact line or the solution unless they ask for it.
