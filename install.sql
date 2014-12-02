create database $db$ character set utf8;
create table $db$.`user` (
  `id` varchar(32) not null,
  `password` varchar(32) not null,
  `role` varchar(32) not null,
  `jsoninfo` varchar(256) not null,
  primary key (`id`)
) character set utf8;
create table $db$.`ticket` (
  `id` int(32) not null auto_increment,
  `starter` varchar(32) not null,
  `owner` varchar(32) not null,
  `updatetime` timestamp not null,
  `status` varchar(32) not null,
  `jsoninfo` varchar(256) not null,
  primary key (`id`)
) charset = utf8; 
create table $db$.`record` (
  `id` int(32) not null auto_increment,
  `ticket` int(32) not null,
  `updatetime` timestamp not null,
  `jsoninfo` varchar(256) not null,
  primary key (`id`)
) charset = utf8;
insert into $db$.`user` (`id`, `password`, `role`, `jsoninfo`)
  values ($admin$, $password$, 'admin', '{}');
