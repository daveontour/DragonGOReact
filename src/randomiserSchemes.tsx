import {
  generateBorderWidth,
  generateColor,
  generatePathWidth,
} from "./randomiserUtils";

export function executeRandomiser(
  state: any,
  pathState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    borderEnabled: boolean;
    startDirection: string;
  },
  activeCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  insideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  outsideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  slideShowRandomise: boolean,
  randomiserScheme: string,
  palette: string,
  lastConstrastValue: string,
  contrastCount: number,
  setLastConstrastValue: (value: string) => void,
  setContrastCount: (value: number) => void
): [any, any, any, any, any] {
  if (slideShowRandomise) {
    state.margin = "5";
    state.cellType = [
      "quadrant",
      "line",
      "corner",
      "knuth",
      "knuthcurve",
      "knuthtri",
    ][Math.floor(Math.random() * 6)];

    state.radius = ["5", "8", "10", "12"][Math.floor(Math.random() * 4)];
    state.folds = ["7", "8", "9", "10", "11"][Math.floor(Math.random() * 5)];
    state.gridlines = Math.random() > 0.75;
    //state.pallette = ["pastel", "vibrant", "random"][Math.floor(Math.random() * 3)];

    if (
      state.cellType === "knuthcurve" ||
      state.cellType === "knuth" ||
      state.cellType === "knuthtri"
    ) {
      state.grouting = ["1", "2", "3", "4", "5"][Math.floor(Math.random() * 5)];
    }

    // set pathState.startDirection to a random value from the set of "UP", "DOWN", "LEFT", "RIGHT"

    pathState.startDirection = ["UP", "DOWN", "LEFT", "RIGHT"][
      Math.floor(Math.random() * 1)
    ];
  } else {
    if (
      state.cellType === "knuthcurve" ||
      state.cellType === "knuth" ||
      state.cellType === "knuthtri"
    ) {
      state.cellType = ["knuth", "knuthcurve", "knuthtri"][
        Math.floor(Math.random() * 3)
      ];
    } else {
      state.cellType = ["quadrant", "line", "corner", "triangle"][
        Math.floor(Math.random() * 4)
      ];
    }

    if (
      state.cellType === "knuthcurve" ||
      state.cellType === "knuth" ||
      state.cellType === "knuthtri"
    ) {
      state.grouting = ["1", "2", "3", "4", "5"][Math.floor(Math.random() * 5)];
    }
  }

  state.triangleAngle = ["0", "10", "20", "30", "45", "50", "60", "65"][
    Math.floor(Math.random() * 8)
  ];

  if (randomiserScheme === "standard") {
    return standardRandomiser(
      state,
      pathState,
      insideCellState,
      outsideCellState,
      activeCellState,
      palette,
      lastConstrastValue,
      contrastCount,
      setLastConstrastValue,
      setContrastCount
    );
  } else if (randomiserScheme === "noOutside") {
    return noOutsideRandomiser(
      state,
      pathState,
      activeCellState,
      insideCellState,
      outsideCellState,
      palette,
      lastConstrastValue,
      contrastCount,
      setLastConstrastValue,
      setContrastCount
    );
  } else if (randomiserScheme === "boldPath") {
    return boldPathRandomiser(
      state,
      pathState,
      activeCellState,
      insideCellState,
      outsideCellState,
      palette,
      lastConstrastValue,
      contrastCount,
      setLastConstrastValue,
      setContrastCount
    );
  } else if (randomiserScheme === "pathOnly") {
    return pathOnlyRandomiser(
      state,
      pathState,
      activeCellState,
      insideCellState,
      outsideCellState,
      palette,
      lastConstrastValue,
      contrastCount,
      setLastConstrastValue,
      setContrastCount
    );
  } else if (randomiserScheme === "triangular") {
    return triangularRandomiser(
      state,
      pathState,
      activeCellState,
      insideCellState,
      outsideCellState,
      palette,
      lastConstrastValue,
      contrastCount,
      setLastConstrastValue,
      setContrastCount
    );
  } else {
    return standardRandomiser(
      state,
      pathState,
      activeCellState,
      insideCellState,
      outsideCellState,
      palette,
      lastConstrastValue,
      contrastCount,
      setLastConstrastValue,
      setContrastCount
    );
  }
}

export function standardRandomiser(
  state: any,
  pathState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    borderEnabled: boolean;
    startDirection: string;
  },
  activeCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  insideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  outsideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  palette: string,
  lastConstrastValue: string,
  contrastCount: number,
  setLastConstrastValue: (value: string) => void,
  setContrastCount: (value: number) => void
): [any, any, any, any, any] {
  pathState.borderStyle = "solid";
  pathState.borderWidth = generatePathWidth(4);
  pathState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  pathState.borderEnabled = Math.random() > 0.1;

  insideCellState.borderStyle = "solid";
  insideCellState.borderWidth = generateBorderWidth(4);
  insideCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.borderEnabled = Math.random() > 0.2;
  insideCellState.fillEnabled = Math.random() > 0.2;

  outsideCellState.borderStyle = "solid";
  outsideCellState.borderWidth = generateBorderWidth(4);
  outsideCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  outsideCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  outsideCellState.borderEnabled = Math.random() > 0.6;
  outsideCellState.fillEnabled = Math.random() > 0.5;

  activeCellState.borderStyle = "solid";
  activeCellState.borderWidth = generateBorderWidth(4);
  activeCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.borderEnabled = Math.random() > 0.5;
  activeCellState.fillEnabled = Math.random() > 0.5;

  return [state, pathState, activeCellState, insideCellState, outsideCellState];
}

export function pathOnlyRandomiser(
  state: any,
  pathState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    borderEnabled: boolean;
    startDirection: string;
  },
  activeCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  insideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  outsideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  palette: string,
  lastConstrastValue: string,
  contrastCount: number,
  setLastConstrastValue: (value: string) => void,
  setContrastCount: (value: number) => void
): [any, any, any, any, any] {
  pathState.borderStyle = "solid";
  pathState.borderWidth = "4px";
  pathState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  pathState.borderEnabled = true;

  insideCellState.borderStyle = "solid";
  insideCellState.borderWidth = generateBorderWidth(4);
  insideCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.borderEnabled = false;
  insideCellState.fillEnabled = false;

  outsideCellState.borderStyle = "solid";
  outsideCellState.borderWidth = generateBorderWidth(4);
  outsideCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  outsideCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  outsideCellState.borderEnabled = false;
  outsideCellState.fillEnabled = false;

  activeCellState.borderStyle = "solid";
  activeCellState.borderWidth = generateBorderWidth(4);
  activeCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.borderEnabled = false;
  activeCellState.fillEnabled = false;

  return [state, pathState, activeCellState, insideCellState, outsideCellState];
}

function noOutsideRandomiser(
  state: any,
  pathState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    borderEnabled: boolean;
    startDirection: string;
  },
  activeCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  insideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  outsideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  palette: string,
  lastConstrastValue: string,
  contrastCount: number,
  setLastConstrastValue: (value: string) => void,
  setContrastCount: (value: number) => void
): [any, any, any, any, any] {
  pathState.borderStyle = "solid";
  pathState.borderWidth = "4px";
  pathState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  pathState.borderEnabled = true;

  insideCellState.borderStyle = "solid";
  insideCellState.borderWidth = generateBorderWidth(4);
  insideCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.borderEnabled = Math.random() > 0.2;
  insideCellState.fillEnabled = Math.random() > 0.2;

  outsideCellState.borderStyle = "solid";
  outsideCellState.borderWidth = "0px";
  outsideCellState.borderColor = "#ffffff";
  outsideCellState.backgroundColor = "#ffffff";
  outsideCellState.borderEnabled = false;
  outsideCellState.fillEnabled = false;

  activeCellState.borderStyle = "solid";
  activeCellState.borderWidth = generateBorderWidth(4);
  activeCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.borderEnabled = Math.random() > 0.5;
  activeCellState.fillEnabled = Math.random() > 0.5;

  return [state, pathState, activeCellState, insideCellState, outsideCellState];
}
function boldPathRandomiser(
  state: any,
  pathState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    borderEnabled: boolean;
    startDirection: string;
  },
  activeCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  insideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  outsideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  palette: string,
  lastConstrastValue: string,
  contrastCount: number,
  setLastConstrastValue: (value: string) => void,
  setContrastCount: (value: number) => void
): [any, any, any, any, any] {
  pathState.borderStyle = "solid";
  pathState.borderWidth =
    Math.floor(Math.random() * 3) + generateBorderWidth(4);
  pathState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  pathState.borderEnabled = true;

  insideCellState.borderStyle = "solid";
  insideCellState.borderWidth = generateBorderWidth(4);
  insideCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.borderEnabled = Math.random() > 0.2;
  insideCellState.fillEnabled = Math.random() > 0.2;

  outsideCellState.borderStyle = "solid";
  outsideCellState.borderWidth = generateBorderWidth(4);
  outsideCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  outsideCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  outsideCellState.borderEnabled = Math.random() > 0.5;
  outsideCellState.fillEnabled = Math.random() > 0.5;

  activeCellState.borderStyle = "solid";
  activeCellState.borderWidth = generateBorderWidth(4);
  activeCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.borderEnabled = Math.random() > 0.5;
  activeCellState.fillEnabled = Math.random() > 0.5;

  return [state, pathState, activeCellState, insideCellState, outsideCellState];
}

function triangularRandomiser(
  state: any,
  pathState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    borderEnabled: boolean;
    startDirection: string;
  },
  activeCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  insideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  outsideCellState: {
    borderStyle: string;
    borderWidth: any;
    borderColor: any;
    backgroundColor: any;
    borderEnabled: boolean;
    fillEnabled: boolean;
  },
  palette: string,
  lastConstrastValue: string,
  contrastCount: number,
  setLastConstrastValue: (value: string) => void,
  setContrastCount: (value: number) => void
): [any, any, any, any, any] {
  state.margin = "0";
  state.cellType = "knuthtri";
  state.radius = ["5", "8", "10", "12"][Math.floor(Math.random() * 4)];
  state.gridlines = false;
  state.grouting = ["1", "2", "3", "4", "5"][Math.floor(Math.random() * 5)];
  state.triangleAngle = ["0", "10", "20", "30", "45", "50", "60", "65"][
    Math.floor(Math.random() * 8)
  ];
  state.folds = ["7", "8", "9", "10", "11"][Math.floor(Math.random() * 5)];

  pathState.startDirection = ["UP", "DOWN", "LEFT", "RIGHT"][
    Math.floor(Math.random() * 1)
  ];

  pathState.borderStyle = "solid";
  pathState.borderWidth = generateBorderWidth(4);
  pathState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  pathState.borderEnabled = true;

  insideCellState.borderStyle = "solid";
  insideCellState.borderWidth = generateBorderWidth(4);
  insideCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  insideCellState.borderEnabled = Math.random() > 0.2;
  insideCellState.fillEnabled = Math.random() > 0.2;

  outsideCellState.borderStyle = "solid";
  outsideCellState.borderWidth = "0px";
  outsideCellState.borderColor = "#ffffff";
  outsideCellState.backgroundColor = "#ffffff";
  outsideCellState.borderEnabled = false;
  outsideCellState.fillEnabled = false;

  activeCellState.borderStyle = "solid";
  activeCellState.borderWidth = generateBorderWidth(4);
  activeCellState.borderColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.backgroundColor = generateColor(
    palette,
    lastConstrastValue,
    contrastCount,
    setLastConstrastValue,
    setContrastCount
  );
  activeCellState.borderEnabled = Math.random() > 0.5;
  activeCellState.fillEnabled = Math.random() > 0.5;

  return [state, pathState, activeCellState, insideCellState, outsideCellState];
}
