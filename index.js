module.exports = Waste;

var TeamFortress2 = require('tf2');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var merge = require('merge')

function Waste (client, opts) {
  EventEmitter.call(this);

  this.client = client;
  this.tf2 = new TeamFortress2(client);

  this.safeMode = opts.safeMode || false;

  this.itemNames = {};
  this.weaponsByClass = {
    scout: [
      44, 45, 46, 163, 220, 221, 222, 317, 325, 349, 355, 448, 449, 450, 648,
      772, 773, 812, 833, 1103
    ], soldier: [
      127, 128, 129, 133, 154, 226, 228, 237, 354, 357, 414, 415, 416, 441, 442,
      444, 447, 474, 513, 730, 775, 939, 1101, 1104, 1153
    ], pyro: [
      38, 39, 40, 153, 214, 215, 326, 348, 351, 457, 593, 594, 595, 739, 740,
      741, 813, 834, 1178, 1179, 1180, 1181
    ], demoman: [
      130, 131, 132, 172, 265, 307, 308, 327, 404, 405, 406, 482, 608, 609, 996,
      1099, 1150, 1151
    ], heavy: [
      41, 42, 43, 159, 239, 310, 311, 312, 331, 424, 425, 426, 656, 811, 832, 1190
    ], engineer: [
      140, 141, 142, 155, 329, 527, 528, 588, 589, 997
    ], medic: [
      35, 36, 37, 173, 304, 305, 411, 412, 413, 998
    ], sniper: [
      56, 57, 58, 171, 230, 231, 232, 401, 402, 526, 642, 751, 752, 1092, 1098
    ], spy: [
      59, 60, 61, 224, 225, 356, 460, 461, 525, 649, 810, 831
    ]
  };

  this.weapons = [];

  Object.keys(this.weaponsByClass).forEach(cls => {
    this.weaponsByClass[cls].forEach(index => {
      this.weapons.push(index);
    })
  });

  this.crap = [
    166, 241, 261, 536, 537, 655, 673, 994, 5022, 5083, 5718, 5734, 5742, 5752,
    5781, 5802, 5803, 5849, 5859, 5867, 5871, 5875, 5888, 5893, 5894, 5897, 5902,
    5904
  ];
}

require('util').inherits(Waste, EventEmitter);

Waste.prototype.start = function () {
  var self = this;

  var timebomb = setTimeout( () => {
    self.emit('complete');
    return;
  }, 30000)

  if (fs.existsSync('itemSchema.json')) {
    self.tf2.itemSchema = JSON.parse(fs.readFileSync('itemSchema.json'));
    self.tf2.emit('itemSchemaLoaded');
  }

  this.tf2.once('connectedToGC', function() {
    console.log('connectedToGC\n');
  });

  this.tf2.once('accountLoaded', function() {
    if (!self.tf2.premium) {
      console.log('Account is f2p');
      self.emit('f2p');
    }
  });

  this.tf2.once('backpackLoaded', function() {
    clearTimeout(timebomb);
    console.log('bp loaded');

    self.emit('craftItems', self.tf2.backpack);

    if (!self.tf2.itemSchema) {
      console.log('Waiting on schema');
      self.tf2.once('itemSchemaLoaded', () => {
        self.getNameById();
        self.main();
      });
    } else {
      self.getNameById();
      self.main();
    }
  });

  this.tf2.once('itemSchemaLoaded', function() {
    console.log('schema loaded');
    fs.writeFileSync('itemSchema.json', JSON.stringify(self.tf2.itemSchema, null, 4));
  });
}

Waste.prototype.main = function () {
  var self = this;

  self.client.removeAllListeners('disconnected');

  self.client.once('disconnected', () => {
    self.emit('complete', self.tf2.backpack);
    return;
  });

  if (self.mapGifts().length > 0) {
    self.mapGifts().forEach(function(item) {
      console.log('Unwrapping => ' + self.itemNames[item] + '...')
      self.tf2.unwrapGift(item);
    });

    setTimeout(function() {
      return self.main();
    }, 3000);

  } else if (self.mapCrap().length > 0) {
    self.getNameById();
    self.deleteCrapStep(self.mapCrap());
  } else if (self.mapWeps()) {
    self.getNameById();
    var weps = self.mapWeps();
    var classes = Object.keys(weps);

    for (var i = 0; i < classes.length; i++) {
      if (weps[classes[i]].length > 1) {
        return self.craftWepsStep(weps[classes[i]]);
        break;
      }
    }
  } else if (self.mapMetal(5000).length > 2) {
    self.getNameById();
    self.craftMetalStep(self.mapMetal(5000));
  } else if (self.mapMetal(5001).length > 2) {
    self.getNameById();
    self.craftMetalStep(self.mapMetal(5001));
  } else {
    console.log('\nThere\'s nothing (else) to craft');
    self.getNameById();
    self.tf2.sortBackpack(3);
    var bp = self.parseBP();
    var sortable = [];

    for (var item in bp)
      sortable.push([item, bp[item]]);
    sortable.sort(function(a, b) {
      return a[1] - b[1]
    });

    bp = sortable.reverse()

    console.log('We have ' + self.tf2.backpack.length + ' items');

    self.emit('complete', self.tf2.backpack);
    return;
  }
}

Waste.prototype.mapGifts = function () {
  var self = this;
  var gifts = [5085];

  var array = [];
  var backpack = self.tf2.backpack.map(function(item) {
    return merge(true, self.tf2.itemSchema.items[item.def_index], item);
  });

  backpack.forEach(function(item) {
    if (gifts.indexOf(item.def_index) > -1) {
      array.push(item.id);
    }
  })

  return array;
}

Waste.prototype.mapCrap = function () {
  var self = this;
  var array = [];
  var backpack = self.tf2.backpack.map(function(item) {
    return merge(true, self.tf2.itemSchema.items[item.def_index], item);
  }).filter(function(item) {
    return (
      item.name.indexOf('Festive') == -1 &&
      item.quality == self.tf2.itemSchema.qualities.unique.value &&
      item.craft_class != 'craft_bar' &&
      !item.customName && !item.customDesc
    );
  });

  backpack.forEach(function(item) {
    if (self.crap.indexOf(item.def_index) > -1 || item.origin == 17) {
      array.push(item.id);
    }
  })

  self.tf2.backpack.forEach(function(item) {
    if (item.flags == 20) {
      Object.keys(self.weaponsByClass).forEach(function(cls) {
        if (self.weaponsByClass[cls].indexOf(item.def_index) > -1) {
          array.push(item.id);
        }
      })
    }
  })

  if (!self.safeMode) {
    self.tf2.backpack.forEach(function(item) {
      if (item.attribute.length > 0) {
        item.attribute.forEach(function(attr) {
          if (attr.def_index == 153) {
            array.push(item.id);
          } else if (attr.def_index == 211) {
            Object.keys(self.weaponsByClass).forEach(function(cls) {
              if (self.weaponsByClass[cls].indexOf(item.def_index) > -1) {
                array.push(item.id);
              }
            })
          }
        })
      }
    })
  }

  return array;
};

Waste.prototype.mapWeps = function () {
  var self = this;
  var backpack = self.tf2.backpack.map(function(item) {
    return merge(true, self.tf2.itemSchema.items[item.def_index], item);
  }).filter(function(item) {
    return (
      item.flags != 20 &&
      item.origin != 2 &&
      item.name.indexOf('Festive') == -1 &&
      item.quality == self.tf2.itemSchema.qualities.unique.value &&
      item.craft_class != 'craft_bar' &&
      !item.customName && !item.customDesc
    );
  });

  for (var i = 0; i < backpack.length; i++) {
    if (backpack[i].attribute.length > 0) {
      backpack[i].attribute.forEach(function(attr) {
        if (attr.def_index == 211) {
          backpack.splice(i, 1);
        }
      });
    }
  }

  var items = {};
  backpack.forEach(function(item) {
    if (items.hasOwnProperty(item.def_index))
      items[item.def_index].push(item);
    else
      items[item.def_index] = [item];
  });
  if (self.safeMode)
    var threshold = 1;
  else
    var threshold = 0;

  var dupes = [];
  Object.keys(items).forEach(function(key) {
    if (threshold) {
      if (items[key].length > threshold) {
        dupes = dupes.concat(items[key].sort(function(a, b) {
          return b.level - a.level;
        }).slice(1));
      }
    } else {
      dupes = dupes.concat(items[key]);
    }
  });

  var byClass = {
    'scout': [],
    'soldier': [],
    'pyro': [],
    'demoman': [],
    'heavy': [],
    'engineer': [],
    'medic': [],
    'sniper': [],
    'spy': []
  };

  dupes.forEach(function(item) {
    Object.keys(self.weaponsByClass).forEach(function(cls) {
      if (self.weaponsByClass[cls].indexOf(item.def_index) > -1) {
        byClass[cls].push(item.id);
      }
    })
  })

  var length = 0;
  Object.keys(byClass).forEach(function(cls) {
    if (byClass[cls].length > 1 && length == 0) {
      length = 1;
    }
  })

  if (length > 0)
    return byClass;
  else
    return false;
};

Waste.prototype.mapMetal = function (def) {
  var self = this;
  var array = [];
  var backpack = self.tf2.backpack.map(function(item) {
    return merge(true, self.tf2.itemSchema.items[item.def_index], item);
  });
  backpack.forEach(function(item) {
    if (item.def_index == def) {
      array.push(item.id);
    }
  })
  return array;
};

Waste.prototype.craftWepsStep = function (array, callback) {
  var self = this;
  var step = function(x) {
    if (x < array.length - 1) {
      var a = array[x];
      var b = array[x + 1];

      self.craftSync([a, b], function() {
        step(x + 2);
      })
    } else {
      self.main();
    }
  }
  step(0);
};

Waste.prototype.craftMetalStep = function (array, callback) {
  var self = this;

  var step = function(x) {
    if (x < array.length - 2) {
      var a = array[x];
      var b = array[x + 1];
      var c = array[x + 2];

      if (a && b && c) {
        self.craftSync([a, b, c], function() {
          step(x + 3);
        })
      } else self.main();
    } else {
      self.main();
    }
  }
  step(0);
};

Waste.prototype.craftSync = function (items, callback) {
  var self = this;
  var names = [];

  items.forEach(function(item) {
    names.push(self.itemNames[item]);
  })

  console.log('Crafting => ' + names.join(' + '));

  self.tf2.craft(items);

  self.tf2.once('craftingComplete', function() {
    console.log(items[0] + ' and ' + items[1] + ' have been crafted');
    callback();
  })
}

Waste.prototype.deleteCrapStep = function (array, callback) {
  var self = this;
  var step = function(x) {
    if (x < array.length) {
      self.deleteSync(array[x], function() {
        step(x + 1);
      })
    } else {
      self.main();
    }
  }
  step(0);
}

Waste.prototype.deleteSync = function (crap, callback) {
  var self = this;
  console.log('Deleting => ' + self.itemNames[crap]);
  self.tf2.deleteItem(crap);

  self.tf2.once('itemRemoved', function() {
    console.log(crap + ' removed');
    return callback();
  })
};

Waste.prototype.getNameById = function () {
  var self = this;
  var ex = {
    'Decoder Ring': 'Supply Crate Key',
    'Craft Bar Level 3': 'Refined Metal',
    'Craft Bar Level 2': 'Reclaimed Metal',
    'Craft Bar Level 1': 'Scrap Metal',
    'Activated Halloween 2015 Pass': 'Soul Gargoyle',
    'Supply Crate Ration 4': 'Crate #89',
    'Supply Crate Ration 5': 'Crate #90',
    'Supply Crate Ration 6': 'Crate #91',
    'Supply Crate Ration 7': 'Crate #92',
    'Customize Texture Tool': 'Decal Tool',
    'Paint Can 1': 'Paint: Indubitably Green',
    'Paint Can 2': 'Paint: Zepheniah\'s Greed',
    'Paint Can 3': 'Paint: Noble Hatter\'s Violet',
    'Paint Can 4': 'Paint: Color No. 216-190-216',
    'Paint Can 5': 'Paint: A Deep Commitment to Purple',
    'Paint Can 6': 'Paint: Mann Co. Orange',
    'Paint Can 7': 'Paint: Muskelmannbraun',
    'Paint Can 8': 'Paint: Peculiarly Drab Tincture',
    'Paint Can 9': 'Paint: Radigan Conagher Brown',
    'Paint Can 10': 'Paint: Ye Olde Rustic Colour',
    'Paint Can 11': 'Paint: Australium Gold',
    'Paint Can 12': 'Paint: Aged Moustache Grey',
    'Employee Badge C': 'Mercenary Badge',
    'Upgradeable TF_WEAPON_SCATTERGUN': 'Scattergun',
    'Upgradeable TF_WEAPON_MEDIGUN': 'Medigun',
    'Upgradeable TF_WEAPON_PIPEBOMBLAUNCHER': 'Grenade Launcher',
    'Upgradeable TF_WEAPON_SHOVEL': 'Shovel',
    'teufort_medigun_civilservant': 'Medigun Skin: Civil Servant',
    'teufort_shotgun_civicduty': 'Shotgun Skin: Civic Duty',
    'powerhouse_minigun_brickhouse': 'Minigun Skin: Brick House',
    'gentlemanne_stickybomblauncher_coffinnail': 'Sticky Launcher Skin: Coffin Nail',
    'concealedkiller_shotgun_backwoodsboomstick': 'Shotgun Skin: Backwoods Boomstick',
    'concealedkiller_minigun_kingofthejungle': 'Minigun Skin: King of the Jungle',
    'Festive Revolver 2014': 'Festive Revolver'

  }
  this.tf2.backpack.forEach(function(item) {
    var n = self.tf2.itemSchema.items[item.def_index].name;
    if (ex[n]) {
      self.itemNames[item.id] = ex[n];
    } else {
      self.itemNames[item.id] = n;
    }
  })
}

Waste.prototype.parseBP = function () {
  var self = this;
  var content = {};
  self.tf2.backpack.forEach(function(item) {
    var name = self.itemNames[item.id];
    if (!content[name]) {
      content[name] = 1;
    } else {
      content[name] += 1;
    }
  })
  return content;
}
