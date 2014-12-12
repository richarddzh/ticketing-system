create database $db$ character set utf8;
create table $db$.`user` (
  `id` varchar(32) not null,
  `password` varchar(32) not null,
  `role` varchar(32) not null,
  `name` varchar(32) not null,
  primary key (`id`)
) character set utf8;
create table $db$.`ticket` (
  `id` int(32) not null auto_increment,
  `starter` varchar(32) not null,
  `startername` varchar(32) not null,
  `owner` varchar(32) not null,
  `issuetime` timestamp not null default current_timestamp,
  `deadline` timestamp not null default '0000-00-00 00:00:00',
  `updatetime` timestamp not null default current_timestamp on update current_timestamp,
  `status` varchar(32) not null,
  `item` varchar(32) not null,
  `detail` varchar(256) not null,
  primary key (`id`)
) charset = utf8; 
create table $db$.`record` (
  `id` int(32) not null auto_increment,
  `ticket` int(32) not null,
  `updatetime` timestamp not null default current_timestamp,
  `action` varchar(32) not null,
  `user` varchar(32) not null,
  `author` varchar(32) not null,
  `comment` varchar(256) not null default '',
  `jsoninfo` varchar(256),
  primary key (`id`)
) charset = utf8;
insert into $db$.`user` (`id`, `password`, `role`, `name`)
  values ($admin$, $password$, 'admin', '管理员');
