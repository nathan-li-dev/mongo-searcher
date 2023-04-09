// cardLimit = the amount of new cards shown every time Load More is requested
const cardLimit = 120;
// numCardsToSkip = the amount of cards for the db to skip
let numCardsToSkip = 0;

// Saved per search, so it cant be changed when loading more
let currentCharacter = "";
let currentArtist = "";
let currentSponsor = "";
let currentRarities = "";
let currentElements = "";
let currentTraits = "";
let currentNatures = "";
let currentDateSort = -1;
let currentCharacterSort = 0;

let tooltipList = [];

// Function to lightly sanitize inputs on multi selects
function cleanSelect(id) {
  const input = document.getElementById(id);
  const selected = input.selectedOptions;
  const values = Array.from(selected).map(({ value }) => value);
  if (values.length === 0) {
    input.selectedIndex = 0;
  }
  if (values.length > 1) {
    input.options[0].selected = false;
  }
  return values;
}

function getSelectsFrom(id) {
  const input = document.getElementById(id);
  const selected = input.selectedOptions;
  const values = Array.from(selected).map(({ value }) => value);
  return values;
}

// Get results from a NEW search
function getResults() {
  numCardsToSkip = 0;

  // Get input values
  currentCharacter = document.getElementById("characterInput").value;
  currentArtist = document.getElementById("artistInput").value;
  currentSponsor = document.getElementById("sponsorInput").value;
  currentRarities = getSelectsFrom("rarityInput");
  currentElements = getSelectsFrom("elementInput");
  currentTraits = getSelectsFrom("traitInput");
  currentNatures = getSelectsFrom("natureInput");
  currentDateSort = document.getElementById("dateSortInput").value;
  currentCharacterSort = document.getElementById("characterSortInput").value;

  let xhr = new XMLHttpRequest();
  // Define how to update the results area when the response is obtained
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // Hide old tooltips
      tooltipList.forEach((tooltip) => {
        tooltip.dispose();
      });
      addCardsFromResponse(xhr.responseText, true);
    }
  };

  // Send a POST to /search with the search data as JSON data
  xhr.open("POST", `/search`, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(
    JSON.stringify({
      character: currentCharacter,
      artist: currentArtist,
      sponsor: currentSponsor,
      rarities: currentRarities,
      elements: currentElements,
      traits: currentTraits,
      natures: currentNatures,
      dateSort: currentDateSort,
      characterSort: currentCharacterSort,
      skip: 0,
      amount: cardLimit,
    })
  );
}

function addCardsFromResponse(responseText, isNewSearch) {
  let response = JSON.parse(responseText);

  const imageBaseUrl = response.imageBaseUrl;

  // If there are still cards left, enable the load more button, otherwise disable it
  const moreButton = document.getElementById("moreButton");
  if (response.isThereMore) {
    moreButton.disabled = false;
  } else {
    moreButton.disabled = true;
  }
  moreButton.innerHTML = `Load More (Showing ${response.amountShowing.toLocaleString()}/${response.amountFound.toLocaleString()})`;

  // Add the new cards to the display
  let html = "";

  const ids = [];
  response.results.forEach((card, index) => {
    const element = card.Element;
    const nature = card.Nature;
    const rarity = card.Rarity;
    const trait = card.Trait;
    const artist = card.artistTag;
    const characterTag = card.characterTag;
    const cardName = card.name;
    const img = card.imgHD;
    const source = card.sourceURL;
    const sponsor = card.sponsor;
    const id = card._id;
    ids.push({ id, characterTag });

    const elementFix = element === "???" ? "No Element" : element;

    const cardDiv = `
    <div class="col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <div class="card mb-4 ${rarity}-glow">
        <a href="${imageBaseUrl}${id}" target="_blank" class="card-img-top" ${getSponsorTooltip(
      sponsor
    )}>
          <img src="${img}" alt="Card for ${cardName}" class="card-img-top"/>
        </a>
        <div class="card-header">
          <h5 class="card-title text-truncate ${rarity} mb-0" style="height:29px; line-height: normal; font-kerning: normal">${cardName}</h5>
          <p class="card-text mb-0"><small class="text-muted"><i class="fa-solid fa-tag me-1"></i>${characterTag}</small></p>
          <p class="card-text mb-1"><small class="text-muted"><i class="fa-solid fa-address-card me-1"></i>#${id}</small></p>
          <span class="badge mb-1 ${rarity}-bg">${rarity}</span>
          <span class="badge mb-1
            ${element === "???" ? "NoElement" : element}-bg">
            ${elementFix}</span>
        </div>
        <div class="card-body py-0">
          <ul class="list-group list-group-flush">
            <li class="list-group-item px-0">
              ${getTraitButton(trait, element)}
              <span class="d-inline-block align-middle"><strong>Trait: </strong>${trait}</span>
            </li>
            <li class="list-group-item px-0">
            ${getNatureButton(nature, element)}
              <span class="d-inline-block align-middle"><strong>Nature: </strong>${nature}</span>
            </li>
          </ul>
        </div>
        <div class="card-footer">
          <a href=${source} target="_blank" class="d-inline-block btn btn-sm btn-light me-2 icon-btn text-center">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a><span class="d-inline-block align-middle">${
            artist === "Unknown" ? "Unknown Artist" : artist
          }</span>
        </div>
      </div>
    </div>`;
    html += cardDiv;
  });

  // Add all the cards
  let resultsDiv = document.getElementById("searchResults");
  if (isNewSearch) {
    resultsDiv.innerHTML = html;
    document.getElementById(
      "resultsCount"
    ).innerHTML = `${response.amountFound.toLocaleString()} Results found.`;
  } else {
    resultsDiv.innerHTML += html;
  }

  // Enable all the new tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-toggle="tooltip"]')
  );

  tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
      html: true,
      trigger: "hover",
    });
  });

  // Add tag button onclick functions
  //ids.forEach((pair) => {
  //  document
  //    .getElementById("charTagButton" + String(pair.id))
  //    .addEventListener("click", () => copyTag(pair.characterTag));
  //});
}

function getSponsorTooltip(sponsor) {
  const title = sponsor
    ? `Sponsored by</br><b>${sponsor}</b>`
    : "No sponsor information";
  const tooltipData = `data-toggle="tooltip" data-html="true" title="${title}"`;
  return tooltipData;
}

function loadMore() {
  numCardsToSkip += cardLimit;

  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // Hide old tooltips
      tooltipList.forEach((tooltip) => {
        tooltip.dispose();
      });
      addCardsFromResponse(xhr.responseText, false);
    }
  };
  xhr.open("POST", `/search`, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(
    JSON.stringify({
      character: currentCharacter,
      artist: currentArtist,
      sponsor: currentSponsor,
      rarities: currentRarities,
      elements: currentElements,
      traits: currentTraits,
      natures: currentNatures,
      dateSort: currentDateSort,
      characterSort: currentCharacterSort,
      skip: numCardsToSkip,
      amount: cardLimit,
    })
  );
}

function copyTag(characterInput) {
  navigator.clipboard.writeText(characterInput);
}

function damageType(element) {
  switch (element) {
    case "Normal":
    case "Fight":
    case "Wind":
    case "Poison":
    case "Earth":
    case "Bug":
    case "Metal":
    case "Blood":
    case "Tech":
      return "physical";
    case "Grass":
    case "Fire":
    case "Water":
    case "Electric":
    case "Psychic":
    case "Ice":
    case "Music":
    case "Dark":
    case "Light":
      return "magical";
    default:
      return "N/A";
  }
}

function getDamageTypeBadge(element) {
  const type = damageType(element);
  let icon = "";
  let classes = "";
  let text = "";
  switch (type) {
    case "physical":
      icon = `fa-solid fa-hand-fist`;
      classes = "physical-bg";
      text = "Physical";
      break;
    case "magical":
      icon = `fa-solid fa-wand-magic-sparkles`;
      classes = "magical-bg";
      text = "Magical";
      break;
    default:
      return ``;
  }
  return `<span class="badge mb-1 ${classes}"><i class="${icon} me-1"></i>${text}</span>`;
}
function getTraitButton(trait, element) {
  let dmgClass = "btn-secondary";
  let icon = "";
  let title = "";
  const dmgType = damageType(element);
  switch (trait) {
    case "Agile":
      icon = "fa-solid fa-shield-halved";
      title = "<b>Agility: </b> +DEF";
      break;
    case "Charismatic":
      icon = "fa-regular fa-circle-xmark";
      title = "<b>Charisma: </b> No benefit";
      break;
    case "Enduring":
      icon = "fa-solid fa-heart";
      title = "<b>Endurance: </b> +HP";
      break;
    case "Intelligent":
      if (dmgType === "magical") dmgClass = "btn-success";
      icon = "fa-solid fa-wand-magic-sparkles";
      title = "<b>Intelligence: </b> +Magic DMG";
      break;
    case "Lucky":
      icon = "fa-solid fa-forward";
      title = "<b>Luck: </b> +Speed";
      break;
    case "Perceptive":
      icon = "fa-solid fa-shield-virus";
      title = "<b>Perception: </b> +Magic DEF";
      break;
    case "Strong":
      if (dmgType === "physical") dmgClass = "btn-success";
      icon = "fa-solid fa-hand-fist";
      title = "<b>Strength: </b> +Phys. DMG";
      break;
  }
  return `<a class="d-inline-block btn btn-sm btn-secondary icon-btn text-center ${dmgClass}" data-toggle="tooltip" data-html="true" data-bs-placement="right" title="${title}">
            <i class="${icon}"></i>
          </a>`;
}

function getNatureTooltip(nature) {
  let title = "";
  switch (nature) {
    case "Lonely":
      title = "<b>+</b> Attack<br><b>-</b> Phys. DEF";
      break;
    case "Adamant":
      title = "<b>+</b> Attack<br><b>-</b> Magic Attack";
      break;
    case "Naughty":
      title = "<b>+</b> Attack<br><b>-</b> Magic Res.";
      break;
    case "Brave":
      title = "<b>+</b> Attack<br><b>-</b> Speed";
      break;
    case "Bold":
      title = "<b>+</b> Phys. DEF<br><b>-</b> Attack";
      break;
    case "Impish":
      title = "<b>+</b> Phys. DEF<br><b>-</b> Magic Attack";
      break;
    case "Lax":
      title = "<b>+</b> Phys. DEF<br><b>-</b> Magic Res.";
      break;
    case "Relaxed":
      title = "<b>+</b> Phys. DEF<br><b>-</b> Speed";
      break;
    case "Modest":
      title = "<b>+</b> Magic Attack<br><b>-</b> Attack";
      break;
    case "Mild":
      title = "<b>+</b> Magic Attack<br><b>-</b> Phys. DEF";
      break;
    case "Rash":
      title = "<b>+</b> Magic Attack<br><b>-</b> Magic Res.";
      break;
    case "Quiet":
      title = "<b>+</b> Magic Attack<br><b>-</b> Speed";
      break;
    case "Calm":
      title = "<b>+</b> Magic Res.<br><b>-</b> Attack";
      break;
    case "Gentle":
      title = "<b>+</b> Magic Res.<br><b>-</b> Phys. DEF";
      break;
    case "Careful":
      title = "<b>+</b> Magic Res.<br><b>-</b> Magic Attack";
      break;
    case "Sassy":
      title = "<b>+</b> Magic Res.<br><b>-</b> Speed";
      break;
    case "Timid":
      title = "<b>+</b> Speed<br><b>-</b> Attack";
      break;
    case "Hasty":
      title = "<b>+</b> Speed<br><b>-</b> Phys. DEF.";
      break;
    case "Jolly":
      title = "<b>+</b> Speed<br><b>-</b> Magic Attack";
      break;
    case "Naive":
      title = "<b>+</b> Speed<br><b>-</b> Magic Res.";
      break;
    case "Hardy":
    case "Docile":
    case "Bashful":
    case "Quirky":
    case "Serious":
      title = "No benefit";
      break;
  }
  return `data-toggle="tooltip" data-html="true" data-bs-placement="right" title="${title}"`;
}

function getNatureButton(nature, element) {
  let dmgClass = "btn-secondary";
  const dmgType = damageType(element);
  let icon = "";

  switch (nature) {
    case "Lonely":
    case "Adamant":
    case "Naughty":
    case "Brave":
      if (dmgType === "physical") dmgClass = "btn-success";
      icon = "fa-solid fa-hand-fist";
      break;
    case "Bold":
    case "Impish":
    case "Lax":
    case "Relaxed":
      icon = "fa-solid fa-shield-halved";
      break;
    case "Modest":
    case "Mild":
    case "Rash":
    case "Quiet":
      if (dmgType === "magical") dmgClass = "btn-success";
      icon = "fa-solid fa-wand-magic-sparkles";
      break;
    case "Calm":
    case "Gentle":
    case "Careful":
    case "Sassy":
      icon = "fa-solid fa-shield-virus";
      break;
    case "Timid":
    case "Hasty":
    case "Jolly":
    case "Naive":
      icon = "fa-solid fa-forward";
      break;
    case "Hardy":
    case "Docile":
    case "Bashful":
    case "Quirky":
    case "Serious":
      icon = "fa-regular fa-circle-xmark";
      break;
  }
  return `
  <a class="d-inline-block btn btn-sm ${dmgClass} icon-btn text-center" ${getNatureTooltip(
    nature
  )}>
    <i class="${icon}"></i>
  </a>`;
}

function getTooltip(stat) {
  let baseToolTip = `data-toggle="tooltip" data-html="true" title="`;
  switch (stat) {
    case "Blood":
      break;
    case "Bug":
      break;
    case "Dark":
      break;
    case "Earth":
      break;
    case "Electric":
      break;
    case "Fight":
      break;
    case "Fire":
      break;
    case "Grass":
      break;
    case "Ice":
      break;
    case "Light":
      break;
    case "Metal":
      break;
    case "Music":
      break;
    case "Normal":
      break;
    case "Poison":
      break;
    case "Psychic":
      break;
    case "Tech":
      break;
    case "Water":
      break;
    case "Wind":
      break;
    case "Blood":
      break;
    case "Blood":
      break;
  }
  baseToolTip += `"`;
}

function clearTextFrom(textInput) {
  document.getElementById(textInput).value = "";
}

function forceLower(textInput) {
  document.getElementById(textInput).value = document
    .getElementById(textInput)
    .value.toLowerCase();
}

document
  .getElementById("natureInput")
  .addEventListener("click", () => cleanSelect("natureInput"));
document
  .getElementById("traitInput")
  .addEventListener("click", () => cleanSelect("traitInput"));
document
  .getElementById("elementInput")
  .addEventListener("click", () => cleanSelect("elementInput"));
document
  .getElementById("rarityInput")
  .addEventListener("click", () => cleanSelect("rarityInput"));
document.getElementById("submit").addEventListener("click", getResults);
document
  .getElementById("moreButton")
  .addEventListener("click", () => loadMore());
document
  .getElementById("clearSponsorButton")
  .addEventListener("click", () => clearTextFrom("sponsorInput"));
document
  .getElementById("clearArtistButton")
  .addEventListener("click", () => clearTextFrom("artistInput"));
document
  .getElementById("clearCharacterButton")
  .addEventListener("click", () => clearTextFrom("characterInput"));
//document
//  .getElementById("characterInput")
//  .addEventListener("keyup", () => forceLower("characterInput"));
//document
//  .getElementById("artistInput")
//  .addEventListener("keyup", () => forceLower("artistInput"));
