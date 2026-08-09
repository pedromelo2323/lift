-- Rename workout templates (remove version numbers)
update workouts set name = 'Push' where name = 'Push3';
update workouts set name = 'Pull' where name = 'Pull3';
update workouts set name = 'Leg/Shoulder' where name = 'Legs3';
