<?php
function mystrreplace($search, $replace, $subject) {
  $offset = 0;
  $index = 0;
  while (($pos = strpos($subject, $search, $offset)) !== false) {
    $replacement = $replace[$index % count($replace)];
    $subject = substr_replace($subject, $replacement, $pos, strlen($search));
    $offset = $pos + strlen($replacement);
    $index++;
  }
  return $subject;
}
echo mystrreplace("??", array(3,2,5), "?? + ?? = ??");
?>