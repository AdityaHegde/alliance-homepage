#! /usr/bin/perl -w

use warnings;
use strict;

my $op = shift @ARGV;
open my $opfile, ">", $op;

print $opfile "campsData = [{\n";

my @levelStrs;

for(my $i = 0; $i < scalar @ARGV; $i += 2) {

  my $raw = `cat $ARGV[$i]` or die "@!";

  my @levels = ($raw =~ /\{\|((?:.|\n)*?)\|\}/gm);
  my $lvl = 1;
  my $type = $ARGV[$i + 1];

  for my $l (@levels) {
    my $levelStr = "  'type' : '$type',\n  'level' : $lvl,\n";
    $lvl++;
    my @items = ($l =~ /\[\[([a-zA-Z ]+?)\]\]/gm);
    my ($hasSpoil) = ($l =~ /Spoils of your/);
    my @qty = ($l =~ /\|style="text-align:center;"\|(.*?)$/gm);
    my $silver = shift @qty;
    $silver =~ s/,//g;
    $levelStr .= "  'silver' : $silver,\n";
    my $time = shift @qty;
    $levelStr .= "  'time' : '$time',\n";
    $levelStr .= "  'items' : [{\n";
    my @itemStrs;
    for my $i (@items) {
      my $qty = shift @qty;
      push @itemStrs, "    'item' : '$i',\n    'qty' : $qty\n";
    }
    $levelStr .= join "  }, {\n", @itemStrs;
    $levelStr .= "  }],\n";
    if($hasSpoil) {
      my $spoils = shift @qty;
      $levelStr .= "  'spoils' : $spoils,\n";
    }
    push @levelStrs, $levelStr;
  }

}

print $opfile (join "}, {\n", @levelStrs);
print $opfile "}]\n";
